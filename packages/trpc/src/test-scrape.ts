import { fetchRecipeFromUrl } from "./utils/scrape";

const main = async () => {
  const url = "https://www.lekkervanbijons.be/recepten/pizza-met-spruitjes-en-ham";

  const recipe = await fetchRecipeFromUrl(url);

  if (recipe.error) {
    console.error(recipe.error);
    return;
  }

  console.log(recipe.data);
};

await main();
