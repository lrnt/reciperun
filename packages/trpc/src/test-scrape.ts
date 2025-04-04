import { fetchRecipeFromUrl } from "./recipes/scrape";

const main = async () => {
  // const url =
  //   "https://www.libelle-lekker.be/bekijk-recept/89204/pizza-met-mascarpone-salami-en-spruitjes";

  const url = "https://www.recipetineats.com/carbonara/";

  // const url = "https://www.instagram.com/p/DHu8hPtoUmg/";

  //const url =
  //  "https://dagelijksekost.vrt.be/gerechten/gebakken-wijting-met-aspergestoemp";
  //const url =
  //  "https://www.lekkervanbijons.be/recepten/pizza-met-spruitjes-en-ham";

  const recipe = await fetchRecipeFromUrl(url);

  if (recipe.error) {
    console.error(recipe.error);
    return;
  }

  console.log(recipe.data);
};

await main();
