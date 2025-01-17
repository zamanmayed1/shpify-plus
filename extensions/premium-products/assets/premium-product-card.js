document.addEventListener("DOMContentLoaded", async () => {
    const premiumList = document.getElementById("premium-product-list");

    try {
        const response = await fetch("/app/routes/api.premium-products.jsx");
        const products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            premiumList.innerHTML = "<p>No premium products available.</p>";
            return;
        }

        premiumList.innerHTML = products.map(product => `
            <div class="premium-card">
                <img src="${product.image}" alt="${product.title}" width="100">
                <h3>${product.title}</h3>
                <p>Price: ${product.price}</p>
                <span class="premium-badge">Premium</span>
            </div>
        `).join("");
    } catch (error) {
        console.error("Failed to load premium products:", error);
        premiumList.innerHTML = "<p>Error loading premium products.</p>";
    }
});
