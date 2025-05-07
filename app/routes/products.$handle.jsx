// Delete metafield code is work


import { AppProvider } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  Thumbnail,
  TextContainer,
  Button,
  Modal,
  TextField,
  ResourceList,
  Banner,
  Breadcrumbs,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import "../asset/style.css";

// Loader function to fetch data
export const loader = async ({ params, request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const { handle } = params;

    const response = await admin.graphql(
      `#graphql
      {
        productByHandle(handle: "${handle}") {
          id
          title
          descriptionHtml
          status
          images(first: 5) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
          variants(first: 1){
            edges {
              node {
                price
              }
            }
          }
          metafields(first: 10, namespace: "custom") {
            edges {
              node {
                id
                namespace
                key
                type
                value
                reference {
                  ... on Product {
                    id
                    title
                    images(first: 1) {
                      edges {
                        node {
                          originalSrc
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        products(first: 250) {
          edges {
            node {
              id
              title
              images(first: 1) {
                edges {
                  node {
                    originalSrc
                  }
                }
              }
            }
          }
        }
      }`
    );

    const data = await response.json();
    const product = data.data.productByHandle;
    const allProducts = data.data.products.edges.map((edge) => edge.node);

    const metafields = product.metafields.edges.reduce((acc, edge) => {
      acc[edge.node.key] = edge.node.reference;
      return acc;
    }, {});

    const price = product.variants.edges[0]?.node.price || "N/A";

    return json({
      product: { ...product, price },
      allProducts,
      selectedTopProduct: metafields.top_product || null,
    });
  } catch (error) {
    console.error("Error fetching product data:", error);
    throw new Response("Product not found", { status: 404 });
  }
};

// Action function for saving/deleting metafields
export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType"); // 'save' or 'delete'
  const selectedProductId = formData.get("selectedProductId");
  const metafieldKey = formData.get("metafieldKey");
  const { handle } = params;

  try {
    // Get Product Owner ID
    const productResponse = await admin.graphql(
      `#graphql
      {
        productByHandle(handle: "${handle}") {
          id
        }
      }`
    );

    const productData = await productResponse.json();
    const ownerId = productData.data.productByHandle.id;

    if (actionType === "delete") {
      // Mutation for deleting the metafield
      const deleteMutation = `#graphql
        mutation {
          metafieldDelete(input: {
            id: ${JSON.stringify(selectedProductId)}
          }) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }`;

      const deleteResponse = await admin.graphql(deleteMutation);
      const deleteResponseData = await deleteResponse.json();

      if (
        deleteResponseData.errors ||
        (deleteResponseData.data.metafieldDelete.userErrors &&
          deleteResponseData.data.metafieldDelete.userErrors.length > 0)
      ) {
        console.error("GraphQL Errors:", deleteResponseData.errors);
        console.error(
          "User Errors:",
          deleteResponseData.data.metafieldDelete.userErrors
        );
        return json({ success: false, error: "Failed to delete metafield" });
      }

      return json({ success: true, message: "Metafield successfully deleted" });
    } else {
      // Save metafield logic
      const selectedProductGlobalId = `gid://shopify/Product/${selectedProductId.replace(
        "gid://shopify/Product/",
        ""
      )}`;

      const mutation = `#graphql
        mutation {
          metafieldsSet(metafields: [
            {
              ownerId: ${JSON.stringify(ownerId)},
              namespace: "custom", 
              key: ${JSON.stringify(metafieldKey)}, 
              type: "product_reference",
              value: ${JSON.stringify(selectedProductGlobalId)}
            }
          ]) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }`;

      const response = await admin.graphql(mutation);
      const responseData = await response.json();

      if (
        responseData.errors ||
        (responseData.data.metafieldsSet.userErrors &&
          responseData.data.metafieldsSet.userErrors.length > 0)
      ) {
        console.error("GraphQL Errors:", responseData.errors);
        console.error(
          "User Errors:",
          responseData.data.metafieldsSet.userErrors
        );
        return json({ success: false, error: "Failed to update metafield" });
      }

      return json({
        success: true,
        message: "Metafield successfully updated",
      });
    }
  } catch (error) {
    console.error("Error handling metafield:", error);
    return json({ success: false, error: "Failed to handle metafield" });
  }
};

// Main Component
export default function ProductDetails() {
  const { product, allProducts, selectedTopProduct } = useLoaderData();
  const fetcher = useFetcher();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metafieldKey, setMetafieldKey] = useState("top_product");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [bannerMessage, setBannerMessage] = useState("");

  const openModal = (key) => {
    setMetafieldKey(key);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm("");
    setFilteredProducts(allProducts);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setFilteredProducts(
      allProducts.filter((product) =>
        product.title.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleSelectProduct = (productId) => {
    fetcher.submit(
      { selectedProductId: productId, metafieldKey, actionType: "save" },
      { method: "post" }
    );
    setBannerMessage(`Product successfully selected for ${metafieldKey}`);
    closeModal();
  };

  const handleDeleteMetafield = () => {
    const metafieldToDelete = product.metafields.edges.find(
      (edge) => edge.node.key === metafieldKey
    )?.node.id;

    if (!metafieldToDelete) {
      setBannerMessage("No metafield found for deletion.");
      return;
    }

    fetcher.submit(
      { selectedProductId: metafieldToDelete, actionType: "delete" },
      { method: "post" }
    );
    setBannerMessage("Metafield successfully deleted");
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      setBannerMessage(fetcher.data.message || "Action completed successfully!");
    }
  }, [fetcher.data]);

  // Breadcrumbs for Top Bar
  const breadcrumbs = [
    {
      content: "Back",
      url: "javascript:history.back()",
    },
  ];

  return (
    <AppProvider i18n={translations}>
      <Card>
        <button className="back-button" onClick={() => window.history.back()}>
          Go Back
        </button>
      </Card>
      <Page
        className="product-page-sec"
        breadcrumbs={breadcrumbs}
        title={product.title || "Product Details"}
      >
        <Layout>
          {/* Left Section */}
          <Layout.Section oneHalf className="left-section">
            <Card sectioned className="left-card">
              <div className="img-and-text">
                <Thumbnail
                  source={
                    product.images?.edges[0]?.node.originalSrc ||
                    "https://via.placeholder.com/150"
                  }
                  alt={
                    product.images?.edges[0]?.node.altText || "Product Image"
                  }
                />
                <div className="product-info">
                  <TextContainer>
                    <h1>{product.title}</h1>
                    <h2>
                      <strong>Price: {product.price}</strong>
                    </h2>
                  </TextContainer>
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Right Section */}
          <Layout.Section oneHalf className="right-section">
            <div className="right-side-div">
              {/* Top Product Card */}
              <h1>Select Free Product</h1>
              <Card title="Top Product" sectioned>
                {selectedTopProduct ? (
                  <>
                    <div className="selected-item-img">
                      <Thumbnail
                        source={
                          selectedTopProduct.images.edges[0]?.node
                            .originalSrc || "https://via.placeholder.com/150"
                        }
                        alt={selectedTopProduct.title}
                      />
                    </div>
                    <TextContainer>
                      <p>{selectedTopProduct?.title}</p>
                    </TextContainer>
                    <Button onClick={handleDeleteMetafield}>
                      Delete Product
                    </Button>
                  </>
                ) : (
                  <p>No Product Selected</p>
                )}
                <Button onClick={() => openModal("top_product")}>
                  Select Product
                </Button>
              </Card>
            </div>
          </Layout.Section>
        </Layout>

        {/* Modal for Selecting Product */}
        {isModalOpen && (
          <Modal
            open
            onClose={closeModal}
            title="Select Product"
            primaryAction={{
              content: "Cancel",
              onAction: closeModal,
            }}
          >
            <Modal.Section>
              <TextField
                label="Search Products"
                value={searchTerm}
                onChange={handleSearch}
                autoComplete="off"
              />
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={filteredProducts}
                renderItem={(item) => {
                  const { id, title, images } = item;
                  const media = (
                    <Thumbnail
                      source={
                        images.edges[0]?.node.originalSrc ||
                        "https://via.placeholder.com/150"
                      }
                      alt={title}
                    />
                  );
                  return (
                    <ResourceList.Item
                      id={id}
                      media={media}
                      onClick={() => handleSelectProduct(id)}
                      accessibilityLabel={`Select ${title}`}
                    >
                      {title}
                    </ResourceList.Item>
                  );
                }}
              />
            </Modal.Section>
          </Modal>
        )}

        {/* Display banner message */}
        {bannerMessage && (
          <Banner status="success">
            <p>{bannerMessage}</p>
          </Banner>
        )}
      </Page>
    </AppProvider>
  );
}