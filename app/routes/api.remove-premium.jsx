import { json } from "@remix-run/node";
import prisma from "../db.server";
export const action = async ({ request }) => {
  const { id } = await request.json();

  try {
    const product = await prisma.premiumProduct.findUnique({ where: { id } });

    if (!product) {
      return json({ success: false, message: "Product not found in premium list." }, { status: 404 });
    }

    await prisma.premiumProduct.delete({ where: { id } });

    return json({ success: true, message: "Product removed from premium list." });
  } catch (error) {
    console.error("Error removing product from premium list:", error);
    return json({ success: false, message: "Failed to remove product." }, { status: 500 });
  }
};
