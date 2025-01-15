import { json } from "@remix-run/node";
import prisma from "./db.server";

export const loader = async () => {
  // Fetch premium product IDs from the database
  const premiumProducts = await prisma.premiumProduct.findMany();
  return json({
    premiumProductIds: premiumProducts.map((p) => p.id),
  });
};
