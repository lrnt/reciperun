import { fetchRecipeFromUrl, normalizeJsonLdRecipe } from "./utils/scrape";

const main = async () => {
  const url = "https://www.lekkervanbijons.be/recepten/pizza-met-spruitjes-en-ham";

  const ldRecipe = await fetchRecipeFromUrl(url);

  if (ldRecipe.error) {
    console.error(ldRecipe.error);
    return;
  }

  const normalizedRecipe = await normalizeJsonLdRecipe(ldRecipe.data, url);

  console.log(normalizedRecipe);
};

await main();
