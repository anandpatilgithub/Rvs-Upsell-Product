import { Card, Layout, Page, Thumbnail, Button, DataTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
// import "./asset/product-list.css"
export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
 
    const response = await admin.graphql(
        `#graphql
        {
            products(first: 250) {
                edges {
                    node {
                        id
                        title
                        handle
                        status
                        images(first: 1) {
                            edges {
                                node {
                                    originalSrc
                                    altText
                                }
                            }
                        }
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
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    endCursor
                    startCursor
                }
            }
        }`
    );
 
    const responseJson = await response.json();
    return json(responseJson.data.products);
};
 
export default function Products() {
    const data = useLoaderData();
    const products = data.edges;
    const pageInfo = data.pageInfo;
 
    const [cursor, setCursor] = useState(pageInfo.endCursor);
    const [hasNextPage, setHasNextPage] = useState(pageInfo.hasNextPage);
    const [hasPreviousPage, setHasPreviousPage] = useState(pageInfo.hasPreviousPage);
 
    useEffect(() => {
        if (cursor) {
            // Fetch next page if cursor changes
            fetchNextPage();
        }
    }, [cursor]);
 
    const fetchNextPage = async () => {
        const response = await fetch(`/your-api-endpoint?cursor=${cursor}`);
        const data = await response.json();
        setHasNextPage(data.pageInfo.hasNextPage);
        setHasPreviousPage(data.pageInfo.hasPreviousPage);
        setCursor(data.pageInfo.endCursor);
    };
 
    const handleNextPage = () => {
        if (hasNextPage) {
            setCursor(pageInfo.endCursor);
            fetchNextPage();
        }
    };
 
    const handlePreviousPage = () => {
        if (hasPreviousPage) {
            setCursor(pageInfo.startCursor);
            fetchNextPage();
        }
    };
 
    const rows = products.map((product) => [
        <Thumbnail
            source={product.node.images.edges[0]?.node.originalSrc || ""}
            alt={product.node.images.edges[0]?.node.altText || "Product Image"}
        />,
        product.node.title,
        product.node.status,
        product.node.variants.edges[0]?.node.price || "",
        <Button plain primary url={`/products/${product.node.handle}`}>
        View Product
    </Button>,
    ]);
 
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <Card>
                        <DataTable
                            columnContentTypes={["text", "text", "text", "text", "text"]}
                            headings={["Image", "Title", "Status", "Price", "Actions"]}
                            rows={rows}
                        />
                        <div style={{ marginTop: "1rem", textAlign: "center" }}>
                            <Button disabled={!hasPreviousPage} onClick={handlePreviousPage}>
                                Previous
                            </Button>
                            <Button disabled={!hasNextPage} onClick={handleNextPage}>
                                Next
                            </Button>
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
 
 