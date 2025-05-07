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
  Tabs,
  LegacyCard,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { useState } from "react";
import "../asset/new-style.css"
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
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
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
            image {
              originalSrc
              altText
            }
          }
        }
      }
    }
  `);
  const responseJson = await response.json();
  return json({
    products: responseJson?.data?.products?.edges || [],
    collections: responseJson?.data?.collections?.edges || [],
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");
  const offerProductIds = JSON.parse(formData.get("offerProductIds"));
  const displayStyle = formData.get("displayStyle");
  const ownerId = formData.get(type === "product" ? "triggerProductId" : "triggerCollectionId");

  const metafields = [
    {
      namespace: "custom_bundle",
      key: type === "product" ? "offer_products" : "collection_products",
      type: "list.product_reference",
      value: JSON.stringify(offerProductIds),
      ownerId,
    },
    {
      namespace: "custom_bundle",
      key: type === "product" ? "display_style" : "collection_style",
      type: "single_line_text_field",
      value: displayStyle,
      ownerId,
    },
  ];

  const response = await admin.graphql(
    `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
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
  return json({ success: !result.data.metafieldsSet.userErrors.length });
};

export default function UnifiedOfferPage() {
  const { products, collections } = useLoaderData();
  const [tabIndex, setTabIndex] = useState(0);
  const [trigger, setTrigger] = useState(null);
  const [offerProducts, setOfferProducts] = useState([]);
  const [displayStyle, setDisplayStyle] = useState("toggle");
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const tabs = [
    { id: "product", content: "Product Offer" },
    { id: "collection", content: "Collection Offer" },
  ];

  const styleOptions = [
    { label: "Button", value: "button" },
    { label: "Checkbox", value: "checkbox" },
    { label: "Toggle", value: "toggle" },
  ];

  const handleTabChange = (index) => {
    setTabIndex(index);
    setTrigger(null);
    setOfferProducts([]);
  };

  const handleTriggerSelect = (item) => {
    setTrigger(item);
    setTriggerModalOpen(false);
  };

  const handleOfferSelect = (item) => {
    if (!offerProducts.find((p) => p.node.id === item.node.id)) {
      setOfferProducts([...offerProducts, item]);
    }
    setOfferModalOpen(false);
  };

  const handleOfferRemove = (id) => {
    setOfferProducts(offerProducts.filter((item) => item.node.id !== id));
  };

  const triggerItems = tabIndex === 0 ? products : collections;

  return (
    <Page title="Create Offer">
      <div className="product-create-offer">
      <div class="product-ofer-text">
     <div class="trigger-product"> <p><b>Trigger Product</b></p>
      This is the product where the On-Page offer will appear. If you want to display an offer on all products in a collection, switch to collection mode.</div>
      <div class="product-offer-texts">
        <p><b>Product Offers</b></p>
These are the products that will be offered. You can offer multiple products but we advise offering one.

If a product has variants, you can choose to only show a specific variant. If left blank, the customer will be able to choose.

You can customize the display settings such as hiding the price and using a custom title such as a call to action.</div>
      </div>
      <div class="texttt">
     
      
      <Layout>
 
        <Layout.Section>
          <LegacyCard title="Online store dashboard" sectioned>
            <p>Select Trigger Product / Collection</p>
            <Tabs tabs={tabs} selected={tabIndex} onSelect={handleTabChange} />
          </LegacyCard>
        </Layout.Section>
        <Layout.Section>
          <Card title="Trigger" sectioned>
            <Button onClick={() => setTriggerModalOpen(true)}>
              Select Trigger {tabIndex === 0 ? "Product" : "Collection"}
            </Button>
            {trigger && (
              <BlockStack>
                <div className="slect-product-collection">
                <Thumbnail
                  source={
                    tabIndex === 0
                      ? trigger.node.images.edges[0]?.node.originalSrc
                      : trigger.node.image?.originalSrc
                  }
                  alt={
                    tabIndex === 0
                      ? trigger.node.images.edges[0]?.node.altText || "Image"
                      : trigger.node.image?.altText || "Image"
                  }
                />
                <Text>{trigger.node.title}</Text>
                </div>
              </BlockStack>
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Offer Products" sectioned>
            <Button onClick={() => setOfferModalOpen(true)}>Add Offer Product</Button>
            {offerProducts.map((item) => (
              <BlockStack key={item.node.id}>
                <div class="offer-product-rvs">
                <Thumbnail
                  source={item.node.images.edges[0]?.node.originalSrc}
                  alt={item.node.images.edges[0]?.node.altText || "Image"}
                />
                <Text>{item.node.title}</Text>
                <Button onClick={() => handleOfferRemove(item.node.id)} destructive>
                  Remove
                </Button>
                </div>
              </BlockStack>
            ))}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Form method="post">
              <input type="hidden" name="type" value={tabIndex === 0 ? "product" : "collection"} />
              <input
                type="hidden"
                name={tabIndex === 0 ? "triggerProductId" : "triggerCollectionId"}
                value={trigger?.node.id || ""}
              />
              <input
                type="hidden"
                name="offerProductIds"
                value={JSON.stringify(offerProducts.map((p) => p.node.id))}
              />
              <div class="style">
                <p>Display Style</p>
              Style
              Products are added to the cart when checked by the customer.
              </div>
              <div class="select-box-save">
              <Select
               
                options={styleOptions}
                onChange={setDisplayStyle}
                value={displayStyle}
                name="displayStyle"
              />
             
              <Button submit primary>Save Offer</Button></div>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        title={`Select Trigger ${tabIndex === 0 ? "Product" : "Collection"}`}
        large
      >
        <Modal.Section>
          <ResourceList
            items={triggerItems}
            renderItem={(item) => {
              const { node } = item;
              return (
                <ResourceItem
                  id={node.id}
                  media={
                    <Thumbnail
                      source={
                        tabIndex === 0
                          ? node.images.edges[0]?.node.originalSrc
                          : node.image?.originalSrc
                      }
                      alt={
                        tabIndex === 0
                          ? node.images.edges[0]?.node.altText || "Image"
                          : node.image?.altText || "Image"
                      }
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

      <Modal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="Select Offer Product"
        large
      >
        <Modal.Section>
          <ResourceList
            items={products}
            renderItem={(item) => {
              const { node } = item;
              return (
                <ResourceItem
                  id={node.id}
                  media={
                    <Thumbnail
                      source={node.images.edges[0]?.node.originalSrc}
                      alt={node.images.edges[0]?.node.altText || "Image"}
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
      </div>
      </div>
    </Page>
  );
}
