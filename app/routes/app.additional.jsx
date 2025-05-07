import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <Page>
      <TitleBar title="Instruction page" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">  
              <Text as="h2" variant="headingMd">
              How to Create an Upsell Product.
              </Text>
              <Text as="p" variant="bodyMd">
                {/* Follow these steps to configure On-Page Upsell Offers for your products or collections:  */}
                Follow these steps to configure and Create Offers for your products or collections:
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">  
              <Text as="h2" variant="headingMd">
              Step 1: Navigate to “Creat Offers Page”
              </Text>
              <Text as="p" variant="bodyMd">
                {/* Follow these steps to configure On-Page Upsell Offers for your products or collections:  */}
                Click the Create Offer to start a new upsell configuration.
              </Text>
              <Text as="h2" variant="headingMd">
              Step 2: Select Offer Type
              </Text>
              <Text as="p" variant="bodyMd">
              Product Offer: Show the offer on a specific product's page.<br/>
              Collection Offer: Apply the offer across all products in a specific collection.
              </Text>
              <Text as="h2" variant="headingMd">
              Step 3: Choose a Trigger Product or Collection
              </Text>
              <Text as="p" variant="bodyMd">
              Click Select Trigger Product to choose the product where the offer will appear.<br/>
              If using a collection, click on Collection Offer tab and select the desired collection.
              </Text>
              <Text as="h2" variant="headingMd">
              Step 4: Add Offer Product(s)
              </Text>
              <Text as="p" variant="bodyMd">
              Click the Add Offer Product button to select one or more products to upsell.
              </Text>
              <Text as="h2" variant="headingMd">
              Step 5: Choose Display Style
              </Text>
              <Text as="p" variant="bodyMd">
              Select how the upsell product should be displayed:<br/>
              {/* Button – a clickable button to add the upsell product.<br/>
              Checkbox – if selected by the customer, the product gets added to cart.<br/>
              Toggle – acts as an on/off switch to include the product in cart. */}
              <ul>
                <li>Button – a clickable button to add the upsell product.</li>
                <li>Checkbox – if selected by the customer, the product gets added to cart.</li>
                <li>Toggle – acts as an on/off switch to include the product in cart.</li>
              </ul>
              </Text>
              <Text as="h2" variant="headingMd">
              Step 6: Save the Offer
              </Text>
              <Text as="p" variant="bodyMd">
              Click Save Offer to activate it.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
          <Layout.Section>
          <Card>
            <BlockStack gap="300">  
            <Text as="h2" variant="headingMd">
            Manage Offers
              </Text>
              <Text as="p" variant="bodyMd">
              Go to the Upsell Products in your app. This is where you can see a list of all your created offers.
              <ul>
                <li>Edit existing offers</li>
               
              </ul>
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        {/* <Layout.Section>
          <Card>
            <BlockStack gap="300">  
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which
                demonstrates how to create multiple pages within app navigation
                using{" "}
                <Link
                  url="https://shopify.dev/docs/apps/tools/app-bridge"
                  target="_blank"
                  removeUnderline
                >
                  App Bridge
                </Link>
                .
              </Text>
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app
                navigation, add a page inside <Code>app/routes</Code>, and a
                link to it in the <Code>&lt;NavMenu&gt;</Code> component found
                in <Code>app/routes/app.jsx</Code>.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section> */}
        {/* <Layout.Section variant="">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    target="_blank"
                    removeUnderline
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section> */}
      </Layout>
    </Page>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
  