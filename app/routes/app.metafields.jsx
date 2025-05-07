import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text,
  Button,
  Modal,
  BlockStack,
  InlineStack,
  Select,
  TextField,
  Link,
  Layout,
} from "@shopify/polaris";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useState } from "react";
import "../asset/new-style.css"
import { useEffect } from 'react';
import { loadTawkTo } from '../asset/script';

// export default function Index() {
//   useEffect(() => {
//     loadTawkTo(); // Load chat script only on client
//   }, []);
//   return (
//     <div>
//       <h1>Welcome to my site</h1>
//     </div>
//   );
// }

// import "../asset/script"

// --- Loader ---
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  originalSrc
                  altText
                }
              }
            }
            metafields(first: 5, namespace: "custom_bundle") {
              edges {
                node {
                  id
                  key
                  value
                }
              }
            }
          }
        }
      }
      collections(first: 100) {
        edges {
          node {
            id
            title
            image {
              originalSrc
              altText
            }
            metafields(first: 5, namespace: "custom_bundle") {
              edges {
                node {
                  id
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `);

  const jsonResponse = await response.json();
  const products = jsonResponse.data.products.edges;
  const collections = jsonResponse.data.collections.edges;

  return json({ products, collections });
};

// --- Action ---
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const ownerId = formData.get("ownerId");
  const offerProductIds = formData.get("offerProductIds");
  const type = formData.get("type");
  const displayStyle = formData.get("displayStyle");

  const key = type === "collection" ? "collection_products" : "offer_products";
  const styleKey = type === "collection" ? "collection_style" : "display_style";

  const metafields = [
    {
      ownerId,
      namespace: "custom_bundle",
      key,
      type: "list.product_reference",
      value: offerProductIds,
    },
    {
      ownerId,
      namespace: "custom_bundle",
      key: styleKey,
      type: "single_line_text_field",
      value: displayStyle,
    },
  ];

  const response = await admin.graphql(
    `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    { variables: { metafields } }
  );

  const result = await response.json();
  return json(result.data.metafieldsSet);
};

// --- Component ---
export default function OnPageOffers() {
  useEffect(() => {
    loadTawkTo(); // Load chat script only on client
  }, []);
  const { products, collections } = useLoaderData();
  const fetcher = useFetcher();

  const [modalData, setModalData] = useState(null);
  const [offerProductIds, setOfferProductIds] = useState([]);
  const [selectedAddProduct, setSelectedAddProduct] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const allProductsList = products.map((p) => p.node);

  const displayItems = [
    ...products
      .filter((p) =>
        p.node.metafields.edges.some(
          (f) => f.node.key === "offer_products" && f.node.value !== "[]"
        )
      )
      .map((p) => ({ ...p, type: "product" })),
    ...collections
      .filter((c) =>
        c.node.metafields.edges.some(
          (f) => f.node.key === "collection_products" && f.node.value !== "[]"
        )
      )
      .map((c) => ({ ...c, type: "collection" })),
  ];

  const openModal = (item) => {
    setModalData(item);

    const metafields = item.node.metafields?.edges || [];

    const offerKey = item.type === "collection" ? "collection_products" : "offer_products";
    const styleKey = item.type === "collection" ? "collection_style" : "display_style";

    const offerIds = metafields.find((f) => f.node.key === offerKey)?.node.value || "[]";
    const styleValue = metafields.find((f) => f.node.key === styleKey)?.node.value || "";

    setOfferProductIds(JSON.parse(offerIds));
    setSelectedStyle(styleValue);
    setSelectedAddProduct("");
  };

  const closeModal = () => {
    setModalData(null);
    setOfferProductIds([]);
    setSelectedStyle("");
    setSelectedAddProduct("");
  };

  const handleRemoveOffer = (id) => {
    setOfferProductIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddOffer = () => {
    if (selectedAddProduct && !offerProductIds.includes(selectedAddProduct)) {
      setOfferProductIds((prev) => [...prev, selectedAddProduct]);
    }
    setSelectedAddProduct("");
  };

  const handleSave = () => {
    fetcher.submit(
      {
        ownerId: modalData.node.id,
        offerProductIds: JSON.stringify(offerProductIds),
        type: modalData.type,
        displayStyle: selectedStyle,
      },
      { method: "post" }
    );
    closeModal();
  };

  const getProductById = (id) => allProductsList.find((p) => p.id === id) || null;

  const availableOptions = allProductsList.map((p) => ({
    label: p.title,
    value: p.id,
  }));

  const filteredItems = displayItems.filter((item) =>
    item.node.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="offers-product-created">

       
     

    <Page title="On Page Offers" >
         <Layout>
            <Layout.Section>
    <Button className="back-button" onClick={() => window.history.back()} >
          ← Back
        </Button>
        </Layout.Section>
        <Layout.Section>
      <Card sectioned>
        <Text variant="bodyMd">
        On Page Offers display offers on products pages underneath the products add to cart. These are great for placing related items to the lead product, shopping the look, creating basic bundles and so on.
            <div className="create-offer-page">
        <Link url="/app/all">
  <Button>Create Offer Page</Button>
</Link></div>
        </Text>  
      </Card>
      </Layout.Section>
  
      <Layout.Section>
   
      <BlockStack gap="400" paddingBlockStart="400">
        <InlineStack align="space-between">
          <TextField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Filter offers"
            clearButton
            onClearButtonClick={() => setSearchValue("")}
          />
          <Select
            labelHidden
            label="Sort by"
            options={[
              { label: "Newest update", value: "newest" },
              { label: "Oldest update", value: "oldest" },
            ]}
            value="newest"
            onChange={() => {}}
          />
        </InlineStack>

        <Card>
          <ResourceList
            resourceName={{ singular: "item", plural: "items" }}
            items={filteredItems}
            renderItem={(item) => {
              const { node, type } = item;
              const image = type === "product"
                ? node.images.edges[0]?.node
                : node.image;
          
              return (
                
                <ResourceItem
                  id={node.id}
                  media={
                    <Thumbnail
                      source={image?.originalSrc || ""}
                      alt={image?.altText || ""}
                    />
                  }
                >
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" fontWeight="medium">
                      {node.title} ({type})
                    </Text>
                    <Button onClick={() => openModal(item)} plain>
                      Edit
                    </Button>
                  </InlineStack>
                </ResourceItem>
              );
            }}
          />
        </Card>
      </BlockStack>
      </Layout.Section>
      </Layout>
      {modalData && (
        <Modal
          open
          onClose={closeModal}
          title={`Edit Offer Products for "${modalData.node.title}"`}
          primaryAction={{ content: "Save", onAction: handleSave }}
          secondaryActions={[{ content: "Cancel", onAction: closeModal }]}
        >
          <Modal.Section>
            <BlockStack gap="200">
              <Select
                label="Select Offer Product(s)"
                options={[{ label: "Select a product", value: "" }, ...availableOptions]}
                value={selectedAddProduct}
                onChange={setSelectedAddProduct}
              />
              <Button onClick={handleAddOffer} disabled={!selectedAddProduct}>
                Add Product
              </Button>

              <Select
                label={modalData.type === "collection" ? "Collection Style" : "Display Style"}
                options={[
                  { label: "Button", value: "button" },
                  { label: "Checkbox", value: "checkbox" },
                  { label: "Toggle", value: "toggle" },
                ]}
                value={selectedStyle}
                onChange={setSelectedStyle}
              />

              {offerProductIds.length === 0 ? (
                <Text>No offer products added.</Text>
              ) : (
                offerProductIds.map((id) => {
                  const product = getProductById(id);
                  return (
                    product && (
                      <InlineStack key={id} gap="400" align="start">
                        <div class="upsell-edit-product-modal">
                          <div class="upsell-edit-product-image">
                        <Thumbnail
                          source={product.images.edges[0]?.node.originalSrc || ""}
                          alt={product.images.edges[0]?.node.altText || ""}
                        />
                        <Text>{product.title}</Text></div>
                        <div class="upsell-product-remove-button">
                        <Button
                          onClick={() => handleRemoveOffer(id)}
                          plain
                          destructive
                        >
                          Remove
                        </Button></div>
                        </div>
                      </InlineStack>
                    )
                  );
                })
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page></div>
  );
}
