import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async () => {
  try {
    const premiumProducts = await prisma.premiumProduct.findMany();
    return json(premiumProducts);
  } catch (error) {
    return json({ error: "Failed to fetch premium products" }, { status: 500 });
  }
};
