import {
  Card,
  Layout,
  Page,
  Button,
  Thumbnail,
  Modal,
  ResourceList,
  ResourceItem,
  Text,
  BlockStack,
  Select,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { useState } from "react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`{
    products(first: 50) {
      edges {
        node {
          id
          title
          handle
          images(first: 1) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  }`);

  const responseJson = await response.json();
  return json(responseJson.data.products);
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const triggerProductId = formData.get("triggerProductId");
  const offerProductIds = JSON.parse(formData.get("offerProductIds"));
  const displayStyle = formData.get("displayStyle");

  const response = await admin.graphql(
    `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId: triggerProductId,
            namespace: "custom_bundle",
            key: "offer_products",
            type: "list.product_reference",
            value: JSON.stringify(offerProductIds),
          },
          {
            ownerId: triggerProductId,
            namespace: "custom_bundle",
            key: "display_style",
            type: "single_line_text_field",
            value: displayStyle,
          },
        ],
      },
    }
  );

  const result = await response.json();

  if (result.data.metafieldsSet.userErrors.length > 0) {
    return json({ success: false, errors: result.data.metafieldsSet.userErrors });
  }

  return json({ success: true });
};

export default function OfferSelectionPage() {
  const data = useLoaderData();
  const products = data.edges;

  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const [triggerProduct, setTriggerProduct] = useState(null);
  const [offerProducts, setOfferProducts] = useState([]);
  const [displayStyle, setDisplayStyle] = useState("toggle");

  const handleTriggerSelect = (product) => {
    setTriggerProduct(product);
    setTriggerModalOpen(false);
  };

  const handleOfferSelect = (product) => {
    const alreadySelected = offerProducts.find((p) => p.node.id === product.node.id);
    if (!alreadySelected) {
      setOfferProducts([...offerProducts, product]);
    }
    setOfferModalOpen(false);
  };

  const styleOptions = [
    { label: "Button", value: "button" },
    { label: "Checkbox", value: "checkbox" },
    { label: "Toggle", value: "toggle" },
  ];

  return (
    <Page title="Create Offer">
      <Layout>
        {/* Trigger Product Section */}
        <Layout.Section>
          <Card title="Trigger Product" sectioned>
            <Text>Select trigger product</Text>
            <BlockStack gap="200">
              <Button onClick={() => setTriggerModalOpen(true)}>Select Trigger Product</Button>
              {triggerProduct && (
                <BlockStack gap="100">
                  <Thumbnail
                    source={triggerProduct.node.images.edges[0]?.node.originalSrc || ""}
                    alt={triggerProduct.node.images.edges[0]?.node.altText || ""}
                  />
                  <Text>{triggerProduct.node.title}</Text>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Offer Product Section */}
        <Layout.Section>
          <Card title="Select Offer Product(s)" sectioned>
            <Text>Select Offer Product(s)</Text>
            <BlockStack gap="200">
              <Button onClick={() => setOfferModalOpen(true)}>Add Product</Button>
              {offerProducts.length > 0 &&
                offerProducts.map((product) => (
                  <BlockStack key={product.node.id} gap="100">
                    <Thumbnail
                      source={product.node.images.edges[0]?.node.originalSrc || ""}
                      alt={product.node.images.edges[0]?.node.altText || ""}
                    />
                    <Text>{product.node.title}</Text>
                  </BlockStack>
                ))}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Display Style Dropdown and Save Button */}
        <Layout.Section>
          <Card sectioned>
            <Form method="post">
              <input
                type="hidden"
                name="triggerProductId"
                value={triggerProduct?.node.id || ""}
              />
              <input
                type="hidden"
                name="offerProductIds"
                value={JSON.stringify(offerProducts.map((p) => p.node.id))}
              />
              <Select
                label="Display Style"
                options={styleOptions}
                onChange={(value) => setDisplayStyle(value)}
                value={displayStyle}
                name="displayStyle"
              />
              <br />
              <Button submit primary disabled={!triggerProduct || offerProducts.length === 0}>
                Save Offer
              </Button>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Trigger Product Modal */}
      <Modal
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        title="Select Trigger Product"
        large
      >
        <Modal.Section>
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={products}
            renderItem={(item) => {
              const { node } = item;
              return (
                <ResourceItem
                  id={node.id}
                  media={
                    <Thumbnail
                      source={node.images.edges[0]?.node.originalSrc || ""}
                      alt={node.images.edges[0]?.node.altText || ""}
                    />
                  }
                  accessibilityLabel={`Select ${node.title}`}
                  onClick={() => handleTriggerSelect(item)}
                >
                  <Text variant="bodyMd" fontWeight="medium">
                    {node.title}
                  </Text>
                </ResourceItem>
              );
            }}
          />
        </Modal.Section>
      </Modal>

      {/* Offer Product Modal */}
      <Modal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="Select Offer Product"
        large
      >
        <Modal.Section>
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={products}
            renderItem={(item) => {
              const { node } = item;
              return (
                <ResourceItem
                  id={node.id}
                  media={
                    <Thumbnail
                      source={node.images.edges[0]?.node.originalSrc || ""}
                      alt={node.images.edges[0]?.node.altText || ""}
                    />
                  }
                  accessibilityLabel={`Select ${node.title}`}
                  onClick={() => handleOfferSelect(item)}
                >
                  <Text variant="bodyMd" fontWeight="medium">
                    {node.title}
                  </Text>
                </ResourceItem>
              );
            }}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
