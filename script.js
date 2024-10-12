// Construct necessary elements
const body = document.getElementsByClassName("blocket-sniper");
const targetElement = document.getElementById("blocket-sniper-target-element");
const triggerAudio = new Audio("trigger.ogg");
let latestArticleName;

// Check if and what the value of `currentValue` is
chrome.storage.local.get(
  ["currentValue", "latestArticleName", "articleLinkHref"],
  (result) => {
    const currentValue = result.currentValue || 0; // Default to 0 if `currentValue` is undefined
    targetElement.innerHTML = currentValue;
    // Check if and what the value of `latestArticleName` is
    if (result.latestArticleName) {
      latestArticleName = result.latestArticleName;
    }
    // Check if and what the value of `articleLinkHref` is
    if (result.articleLinkHref) {
      console.log(`Value of article link: ${result.articleLinkHref}`);
    }
  }
);

// Check if and what the value of `refreshedAutomatically` is, if it's true, refresh the script
setTimeout(() => {
  chrome.storage.local.get(["refreshedAutomatically"], (result) => {
    if (result.refreshedAutomatically) {
      console.log("Refreshed automatically");
      chrome.storage.local.set({ refreshedAutomatically: false }, () => {
        injectScript();
        watchOverEverything();
      });
    }
  });
}, 3000);

// Create iteration variable
let i;

// Inject the script into the current tab
function injectBlocket(i, latestArticleName) {
  console.log(`Current value of latest article: ${latestArticleName}`);

  // Search for a div with a class that contains "AdwatchAdsList__ListWrapper"
  const blocketListWrapper = document.querySelector(
    "[class^='AdwatchAdsList__ListWrapper']"
  );

  // Failsafe
  if (!blocketListWrapper) {
    console.log("Error occured on page reload, refreshing...");
    setTimeout(() => {
      location.reload();
      return;
    }, Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000); // Random delay between 3-5 seconds
  }
  // Find the first Article element in blocketListWrapper with a class that contains "styled__Article"
  const firstArticle = blocketListWrapper.querySelector(
    "[class^='styled__Article']"
  );
  if (firstArticle) {
    // Find the span with a class that contains "styled__SubjectContainer" in firstArticle
    const subjectContainer = firstArticle.querySelector(
      "[class^='styled__SubjectContainer']"
    );
    if (subjectContainer) {
      // Find the <a> element
      const articleLink = firstArticle.querySelector("h2 a");
      // Extract the href attribute from the articleLink
      let articleLinkHref = articleLink.getAttribute("href");
      articleLinkHref = `https://www.blocket.se${articleLinkHref}`;
      // Set latest article name
      chrome.storage.local.set(
        { latestArticleName: subjectContainer.innerHTML },
        () => {
          console.log(
            `Value of latest article name updated to: ${subjectContainer.innerHTML}`
          );
          if (subjectContainer.innerHTML !== latestArticleName) {
            console.log("New article detected!");
            // Set the articleLinkHref to local storage
            chrome.storage.local.set(
              { articleLinkHref: articleLinkHref },
              () => {
                console.log(
                  `Value of article link updated to: ${articleLinkHref}`
                );
              }
            );
          } else {
            console.log("No new article detected, refreshing...");
          }
        }
      );
    }
  }
  // Increment the value of `i` and store it in `chrome.storage`
  setTimeout(() => {
    i++;
    chrome.storage.local.set({ currentValue: i }, () => {
      console.log(`Value of i updated to: ${i}`);
    });
    location.reload();
  }, Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000); // Random delay between 3-5 seconds
}

// Inject the script into the current tab
function injectScript() {
  // Retrieve the value of `i` from `chrome.storage` before injecting the script
  chrome.storage.local.get(["currentValue", "latestArticleName"], (result) => {
    // Default `i` to 0 if no value is stored
    let i = result.currentValue || 0;
    let latestArticleName = result.latestArticleName || "";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: injectBlocket,
        args: [i, latestArticleName], // Pass the retrieved value of `i` and `latestArticleName` to the script
      });
    });
  });
}

function watchOverEverything() {
  let currentValue = 0;
  let futureValue = 0;
  chrome.storage.local.get(["currentValue"], (result) => {
    currentValue = result.currentValue || 0; // Default to 0 if `currentValue` is undefined
  });
  setTimeout(() => {
    chrome.storage.local.get(["currentValue"], (result) => {
      futureValue = result.currentValue || 0; // Default to 0 if `currentValue` is undefined
      if (futureValue === currentValue) {
        console.log("Unknown bug occurred, refreshing...");
        chrome.storage.local.set({ refreshedAutomatically: true }, () => {
          location.reload();
        });
      }
    });
  }, 10000);
}

// Add event listeners to the buttons
document
  .getElementById("blocket-sniper-inject-script")
  .addEventListener("click", (e) => {
    chrome.storage.local.set({ currentValue: 0 }, () => {
      console.log("Value of i reset to 0");
      targetElement.innerHTML = 0;
    });
    injectScript();
    watchOverEverything();
  });
// Add event listener to the reset button to reset the value of `i` to 0
document
  .getElementById("blocket-sniper-reset-counter")
  .addEventListener("click", (e) => {
    chrome.storage.local.set({ currentValue: 0 }, () => {
      console.log("Value of i reset to 0");
    });
    location.reload();
  });

// Listen for changes in `currentValue` and re-inject script after a delay
chrome.storage.onChanged.addListener((changes, namespace) => {
  // Re-inject the script if `currentValue` changes
  if (changes.currentValue) {
    console.log("currentValue changed, re-injecting script...");
    chrome.storage.local.get(["currentValue"], (result) => {
      const currentValue = result.currentValue || 0; // Default to 0 if `currentValue` is undefined
      targetElement.innerHTML = currentValue;
      if (currentValue >= 50) {
        chrome.storage.local.set({ refreshedAutomatically: true }, () => {});
        console.log("Reached 50 resets, reloading extension...");
        chrome.storage.local.set({ currentValue: 0 }, () => {
          console.log("Value of i reset to 0");
        });
        location.reload();
      }
    });
    setTimeout(() => {
      injectScript();
    }, 3000);
  }
  // Play the sound and open the article in a new tab if `latestArticleName` changes
  if (changes.latestArticleName) {
    // play the sound from the soundfile "trigger.ogg"
    triggerAudio.play();
    let articleLinkHref;
    chrome.storage.local.get(["articleLinkHref"], (result) => {
      if (result.articleLinkHref) {
        // Open articleLinkHref in a new tab, unfocused to not interrupt the script
        articleLinkHref = result.articleLinkHref;
        // chrome.tabs.create({ url: articleLinkHref, active: false });
        // Also open it in a new window
        chrome.windows.create({ url: articleLinkHref, focused: false });
      }
    });
  }
});
