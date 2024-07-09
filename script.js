
// Defining a TrieNode class
class TrieNode {
  constructor() {
    this.children = {};
    this.endOfWord = false;
  }
}

// Defining a Trie class
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // To Insert a word into the trie
  insert(word) {
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.endOfWord = true;
  }

  // For searching for words with given prefix
  search(prefix) {
    let node = this.root;
    for (let char of prefix) {
      if (node.children[char]) {
        node = node.children[char];
      } else {
        return [];
      }
    }
    return this._findAllWords(node, prefix);
  }

  // To find all words from a given node
  _findAllWords(node, prefix) {
    let results = [];
    if (node.endOfWord) {
      results.push(prefix);
    }
    for (let char in node.children) {
      results = results.concat(
        this._findAllWords(node.children[char], prefix + char)
      );
    }
    return results;
  }
}

// Create a new Trie instance
const trie = new Trie();

// Fetch list of country names from REST Countries API
async function fetchCountryNames() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    if (!response.ok) {
      throw new Error("Failed to fetch country names");
    }
    const data = await response.json();
    return data.map((country) => country.name.common);
  } catch (error) {
    console.error("Error fetching country names:", error);
    return [];
  }
}

// Function to initialize autocomplete with fetched country names
async function initializeAutocomplete() {
  const countries = await fetchCountryNames();
  if (countries.length === 0) {
    console.error("No country names fetched");
    return;
  }

  // Insert all countries into trie
  countries.forEach((country) => trie.insert(country));

  const searchInput = document.getElementById("searchInput");
  const autocompleteContainer = document.getElementById(
    "autocompleteContainer"
  );
  const countryDetailsContainer = document.getElementById("countryDetails");

  // Function to fetch country details from Rest Countries API
  async function fetchCountryDetails(countryName) {
    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${countryName}?fullText=true`
      );
      if (!response.ok) {
        throw new Error("Country not found");
      }
      const data = await response.json();
      return data[0];
    } catch (error) {
      console.error("Error fetching country details:", error);
      return null;
    }
  }

  // Function to display country details in card format
  function displayCountryDetails(countryDetails) {
    if (!countryDetails) {
      return;
    }
    const { name, capital, population, languages, flags } = countryDetails;
    const flagUrl = flags ? flags.svg : "";

    // Handle languages
    let languagesList = "Unknown";
    if (languages && typeof languages === "object") {
      languagesList = Object.keys(languages)
        .map((key) => languages[key])
        .join(", ");
    }

    const countryCard = `
        <div class="country-card">
            <img src="${flagUrl}" alt="Flag" class="country-flag">
            <div class="country-info">
                <h2>${name.common}</h2>
                <p><strong>Capital:</strong> ${capital}</p>
                <p><strong>Population:</strong> ${population.toLocaleString()}</p>
                <p><strong>Languages:</strong> ${languagesList}</p>
            </div>
        </div>
    `;

    countryDetailsContainer.innerHTML = countryCard;
  }

  // Function to handle input change
  searchInput.addEventListener("input", async function () {
    const inputValue = this.value.trim();
    const suggestions = trie.search(inputValue);

    // Clear previous results
    autocompleteContainer.innerHTML = "";

    // Display autocomplete suggestions
    suggestions.forEach((suggestion) => {
      const autocompleteItem = document.createElement("div");
      autocompleteItem.classList.add("autocomplete-item");
      autocompleteItem.textContent = suggestion;

      autocompleteItem.addEventListener("click", async function () {
        searchInput.value = suggestion;
        autocompleteContainer.innerHTML = "";

        // Fetch country details from API
        const countryDetails = await fetchCountryDetails(suggestion);
        displayCountryDetails(countryDetails);
      });

      autocompleteContainer.appendChild(autocompleteItem);
    });

    // Show or hide autocomplete container based on input value
    if (inputValue) {
      autocompleteContainer.style.display = "block";
    } else {
      autocompleteContainer.style.display = "none";
      countryDetailsContainer.innerHTML = "";
    }
  });

  // Hide autocomplete when clicking outside of it
  document.addEventListener("click", function (event) {
    if (
      !autocompleteContainer.contains(event.target) &&
      event.target !== searchInput
    ) {
      autocompleteContainer.style.display = "none";
    }
  });
}

// Initialize autocomplete functionality
initializeAutocomplete();
