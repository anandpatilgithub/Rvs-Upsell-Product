import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  MediaCard,
  Thumbnail,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
// import { loadTawkTo } from '../asset/script.js';

// export default function Index() {
//   useEffect(() => {
//     loadTawkTo(); // Load chat script only on client
//   }, []);
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page fullWidth>
      <TitleBar title="RVS Unified Variants ✨">
         
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h1" variant="headingMd"> Welcome to RVS Upsell Product!🎉</Text>
                  <Text variant="bodyMd" as="p">
                  RVS Upsell Product has now been successfully set up on your store. <br/>
                  You can always verify this by visiting the Settings page. <br/>
                  Watch the video on the right to learn how to create your first offer. <br/>
                  You can also check the documentation below for more detailed instructions
                  </Text>
                </BlockStack>

          

 
                {fetcher.data?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.product, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantsBulkUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.variant, null, 2)}
                        </code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          </Layout>
          <Layout>
          <Layout.Section > 
          <Card>
          <BlockStack gap="200">
                 <Text as="h2" variant="headingMd">Key Features:</Text>
                  <Text as="h3" variant="headingMd">
                   1. Show Upsell Products on:
                  </Text>
                  <Text as="p" variant="bodyMd">
                  Specific Products<br/>
                  Specific Collections
                  </Text>
                  <Text as="h3" variant="headingMd">
                   2. Display Styles:
                  </Text>
                  <Text as="p" variant="bodyMd">
                  Button: Add Upsell Product" action button.<br/>
                  Checkbox: When selected, the upsell product is added to the cart.<br/>
                  Toggle: Similar to a checkbox, but uses a switch-style toggle.
                  </Text>
                  <Text as="h3" variant="headingMd">
                   3. Smart Add to Cart:
                  </Text>
                  <Text as="p" variant="bodyMd">
                  If the Checkbox or Toggle is selected, the upsell product is added to the cart automatically along with the main product.
                  </Text>
                </BlockStack>
          </Card>
          </Layout.Section>
          </Layout>
          <Layout>
          <Layout.Section variant="oneThird"> 
            <BlockStack gap="500">
              <Card>
              <img
                alt=""
                width="100%"
                height="350px"
                style={{objectFit: 'contain', objectPosition: 'center'}}
                src="https://cdn.shopify.com/s/files/1/0946/1501/1657/files/CheckBox.png?v=1746520106"
              /> 
              </Card>
            </BlockStack>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200"> 
                    <img
                      alt=""
                      width="100%"
                      height="350px"
                      style={{objectFit: 'contain', objectPosition: 'center'}}
                      src="https://cdn.shopify.com/s/files/1/0946/1501/1657/files/toggle.png?v=1746520107"
                    /> 
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section> 
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200"> 
                    <img
                      alt=""
                      width="100%"
                      height="350px"
                      style={{objectFit: 'contain', objectPosition: 'center'}}
                      src="https://cdn.shopify.com/s/files/1/0946/1501/1657/files/Add_TO_Cart.png?v=1746524090"
                    /> 
                </BlockStack>
                
              </Card>
            </BlockStack>
          </Layout.Section> 
        </Layout>
      </BlockStack>
    </Page>
  );
}


