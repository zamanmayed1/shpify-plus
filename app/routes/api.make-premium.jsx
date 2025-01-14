import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { id, image, title, price } = await request.json();

  try {
    await prisma.premiumProduct.upsert({
      where: { id },
      update: { image, title, price, isPremium: true },
      create: { id, image, title, price, isPremium: true },
    });

    return json({ success: true, message: "Product marked as premium!" });
  } catch (error) {
    console.error("Error marking product as premium:", error);
    return json({ success: false, message: "Failed to mark product as premium." }, { status: 500 });
  }
};
