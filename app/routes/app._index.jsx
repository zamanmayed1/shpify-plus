import {
  Page,
  Card,
  ResourceList,
  Thumbnail,
  Text,
  Toast,
  Frame,
  Badge,
  Button,
  Spinner,
  TextField,
  Select,
} from "@shopify/polaris";
import { json, useLoaderData } from "@remix-run/react";
import { useState, useCallback } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(` 
    query fetchAllProducts {
      products(first: 100) {
        edges {
          node {
            id
            title
            description
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            totalInventory
            vendor
            tags
          }
        }
      }
    }
  `);

  const productsData = (await response.json()).data;

  // Fetch premium product IDs from Prisma
  const premiumProducts = await prisma.premiumProduct.findMany();
  const premiumProductIds = new Set(premiumProducts.map((p) => p.id));

  return json({
    products: productsData.products.edges.map((product) => ({
      ...product.node,
      isPremium: premiumProductIds.has(product.node.id),
    })),
  });
};

export default function DashboardPage() {
  const { products } = useLoaderData();
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState(products);

  const toggleToast = useCallback(() => setShowToast((prev) => !prev), []);

  const handleSearch = (value) => {
    setSearchQuery(value);
    const lowerCaseQuery = value.toLowerCase();

    const filtered = products.filter((product) => {
      const matchesQuery = product.title.toLowerCase().includes(lowerCaseQuery);
      const matchesSort =
        sortOption === "all" ||
        (sortOption === "premium" && product.isPremium) ||
        (sortOption === "normal" && !product.isPremium);
      return matchesQuery && matchesSort;
    });

    setFilteredProducts(filtered);
  };

  const handleSortChange = (value) => {
    setSortOption(value);

    const filtered = products.filter((product) => {
      const matchesQuery = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSort =
        value === "all" ||
        (value === "premium" && product.isPremium) ||
        (value === "normal" && !product.isPremium);
      return matchesQuery && matchesSort;
    });

    setFilteredProducts(filtered);
  };

  const handleMarkedPremium = async (product) => {
    setLoadingProductId(product.id);
    const premiumProduct = {
      id: product.id,
      image: product.featuredImage?.url || "https://cdn-icons-png.flaticon.com/512/8136/8136031.png",
      title: product.title,
      price: `${product.priceRange?.minVariantPrice?.amount}${product.priceRange?.minVariantPrice?.currencyCode}`,
    };

    try {
      const response = await fetch("/api/make-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(premiumProduct),
      });

      if (response.ok) {
        product.isPremium = true; // Update the local product status
        setToastContent("Product marked as premium!");
        setToastError(false); // Green toast for success
      } else {
        setToastContent("Failed to mark product as premium.");
        setToastError(true); // Red toast for error
      }
      setShowToast(true); // Show the toast
    } catch (error) {
      console.error("Error:", error);
      setToastContent("Something went wrong.");
      setToastError(true); // Red toast for error
      setShowToast(true); // Show the toast
    } finally {
      setLoadingProductId(null); // Reset loading state
    }
  };

  return (
    <Frame>
      <Page title="Dashboard">
        <Card>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom : "20px"
              
            }}
          >
            <TextField
              label="Search Products"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by title"
              autoComplete="off"
              size="medium"
            />
            <Select
              label="Sort By"
              options={[
                { label: "All Products", value: "all" },
                { label: "Premium Products", value: "premium" },
                { label: "Normal Products", value: "normal" },
              ]}
              value={sortOption}
              onChange={handleSortChange}
            />
          </div>

          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            emptyState="No Products Found"
            items={filteredProducts}
            renderItem={(product) => {
              const {
                id,
                title,
                featuredImage,
                totalInventory,
                priceRange,
                isPremium,
              } = product;

              const media = (
                <Thumbnail
                  source={
                    featuredImage?.url || "https://cdn-icons-png.flaticon.com/512/8136/8136031.png"
                  }
                  alt={featuredImage?.altText || "Product Image"}
                  size="medium"
                />
              );

              return (
                <ResourceList.Item
                  id={id}
                  media={media}
                  accessibilityLabel={`View details for ${title}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3>
                        <Text as="h3" variant="headingMd">
                          {title}{" "}
                          {isPremium && <Badge status="success">Premium</Badge>}
                        </Text>
                      </h3>
                      <div>
                        Price: {priceRange?.minVariantPrice?.amount}
                        {priceRange?.minVariantPrice?.currencyCode}
                      </div>
                      <div>Stock: {totalInventory}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Button
                        primary
                        disabled={isPremium || loadingProductId === id} // Disable if already premium or loading
                        onClick={() => handleMarkedPremium(product)}
                      >
                        {isPremium ? "Already Premium" : "Make it Premium"}
                      </Button>
                      {loadingProductId === id && (
                        <div style={{ marginTop: "10px" }}>
                          <Spinner accessibilityLabel="Loading" size="small" />
                        </div>
                      )}
                    </div>
                  </div>
                </ResourceList.Item>
              );
            }}
          />
        </Card>

        {/* Toast for Notifications */}
        {showToast && (
          <Toast
            content={toastContent}
            error={toastError} // Red for error, green for success
            onDismiss={toggleToast} // Auto-hide after 2 seconds
            duration={2000}
          />
        )}
      </Page>
    </Frame>
  );
}
