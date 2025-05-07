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
} from "@shopify/polaris";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import "../asset/new-style.css";

export default function OnPageOffers() {
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
      <Page title="On Page Offers">
        <Button className="back-button" onClick={() => window.history.back()}>
          ← Back
        </Button>

        <Card sectioned>
          <Text variant="bodyMd">
            On Page Offers display offers on product pages underneath the add to cart. These are great for related items, bundles, shop-the-look, etc.
          </Text>
          <Link url="/app/all">
            <Button>Create Offer Page</Button>
          </Link>
        </Card>

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
                          <div className="upsell-edit-product-modal">
                            <div className="upsell-edit-product-image">
                              <Thumbnail
                                source={product.images.edges[0]?.node.originalSrc || ""}
                                alt={product.images.edges[0]?.node.altText || ""}
                              />
                              <Text>{product.title}</Text>
                            </div>
                            <div className="upsell-product-remove-button">
                              <Button
                                onClick={() => handleRemoveOffer(id)}
                                plain
                                destructive
                              >
                                Remove
                              </Button>
                            </div>
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
      </Page>
    </div>
  );
}
