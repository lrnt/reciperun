import { fetchRecipeFromUrl } from "./recipes/scrape";

const main = async () => {
  // const url =
    // "https://www.libelle-lekker.be/bekijk-recept/89204/pizza-met-mascarpone-salami-en-spruitjes";

  const url = "https://www.recipetineats.com/carbonara/";

  const recipe = await fetchRecipeFromUrl(url);

  if (recipe.error) {
    console.error(recipe.error);
    return;
  }

  console.log(recipe.data);
};

await main();
