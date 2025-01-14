import {
  Page,
  Card,
  ResourceList,
  Thumbnail,
  Text,
  Toast,
  Frame,
  Button,
} from "@shopify/polaris";
import { json, useLoaderData } from "@remix-run/react";
import { useState, useCallback } from "react";
import prisma from "../db.server";

// Loader to fetch premium products from the database
export const loader = async () => {
  const premiumProducts = await prisma.premiumProduct.findMany();
  return json({ premiumProducts });
};

export default function PremiumProductsPage() {
  const { premiumProducts } = useLoaderData();
  const [products, setProducts] = useState(premiumProducts);

  // Toast State
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const toggleToast = useCallback(() => setShowToast((prev) => !prev), []);

  // Handle "Make it Normal" button click
  const handleMakeItNormal = async (productId) => {
    try {
      const response = await fetch("/api/remove-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: productId }),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.filter((product) => product.id !== productId),
        );
        setToastContent("Ok Bad Dilaisi!");
        setToastError(false); // Green toast for success
        setShowToast(true); // Show the toast
      } else {
        setToastContent("Otto Oilo Na");
        setToastError(true); // Red toast for error
        setShowToast(true); // Show the toast
      }
    } catch (error) {
      console.error("Error:", error);
      setToastContent("Kitay ektu somossa Korer!");
      setToastError(true); // Red toast for error
      setShowToast(true); // Show the toast
    }
  };

  return (
    <Frame>
      <Page title="Premium Products">
        <Card>
          <ResourceList
            resourceName={{
              singular: "premium product",
              plural: "premium products",
            }}
            items={products}
            emptyState="Premium Products Nai!"
            renderItem={(product) => {
              const { id, title, image, price } = product;

              const media = (
                <Thumbnail
                  source={image || "https://via.placeholder.com/120"}
                  alt={`Image for ${title}`}
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
                          {title}
                        </Text>
                      </h3>
                      <div>
                        <Text variation="subdued">Price: {price}</Text>
                      </div>
                    </div>
                    <div>
                      <Button
                        destructive
                        onClick={() => handleMakeItNormal(id)}
                      >
                        Make it Normal
                      </Button>
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
