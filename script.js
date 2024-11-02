// Construct necessary elements
const body = document.getElementsByClassName("blocket-sniper");
const targetElement = document.getElementById("blocket-sniper-target-element");
const outputLog = document.getElementById("blocket-sniper-output-log");
const activateSilentMode = document.getElementById(
  "blocket-sniper-silent-mode"
);
const triggerAudio = new Audio("trigger.ogg");
const silentTriggerAudio = new Audio("silent-trigger.mp3");
const discordWebHook =
  "https://discord.com/api/webhooks/1295972631149023294/nnki2giaIU2ZjlPpElc29YpJUeQm0m7XyV80S55I9YyXZ7_UAku2Tm5Bmrh_8RgsWNTL";
let latestArticleName;
let i; // Create iteration variable
// Automatically open the inspector of the extension when it's opened

// Check if and what the value of `currentValue` is
function fetchLocalStorage() {
  chrome.storage.local.get(
    ["currentValue", "latestArticleName", "articleLinkHref", "isSilentMode"],
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
      if (result.isSilentMode) {
        activateSilentMode.checked = true;
      } else {
        activateSilentMode.checked = false;
      }
      if (result.outputLog) {
        outputLog.innerHTML = result.outputLog;
      }
    }
  );
}
fetchLocalStorage(); // Fetch the local storage

// Check if and what the value of `refreshedAutomatically` is, if it's true, refresh the script
function checkAutomaticRefresh() {
  setTimeout(() => {
    chrome.storage.local.get(["refreshedAutomatically"], (result) => {
      if (result.refreshedAutomatically) {
        chrome.storage.local.set(
          {
            refreshedAutomatically: false,
            outputLog: "Refreshed automatically",
          },
          () => {
            injectScript();
            watchOverEverything();
          }
        );
      }
    });
  }, 2000);
}
checkAutomaticRefresh(); // Check if the script should be refreshed

// Inject the script into the current tab
function injectBlocket() {
  // Random delay between 1 and 2 seconds
  const randomDelay = Math.floor(Math.random() * 2000) + 1000;
  // Retrieve the value of `i` from `chrome.storage` before injecting the script
  let i;
  let latestArticleName;

  chrome.storage.local.get(["currentValue", "latestArticleName"], (result) => {
    // Default `i` to 0 if no value is stored
    i = result.currentValue || 0;
    latestArticleName = result.latestArticleName || "";
  });

  // Search for a div with a class that contains "AdwatchAdsList__ListWrapper"
  const blocketListWrapper = document.querySelector(
    "[class^='AdwatchAdsList__ListWrapper']"
  );

  // Failsafe
  if (!blocketListWrapper) {
    setTimeout(() => {
      i++;
      chrome.storage.local.set(
        {
          currentValue: i,
          outputLog:
            "Error occured on page reload, incrementing and refreshing...",
        },
        () => {
          location.reload();
          return;
        }
      );
    }, randomDelay); // Random delay between 3-5 seconds
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
      const articleLink = firstArticle.querySelector("h2 a"); // Find the <a> element
      let articleLinkHref = articleLink.getAttribute("href"); // Extract the href attribute from the articleLink
      articleLinkHref = `https://www.blocket.se${articleLinkHref}`;
      chrome.storage.local.set(
        {
          latestArticleName: subjectContainer.innerHTML, // Set latest article name
          outputLog: `Senaste annonsnamn: ${subjectContainer.innerHTML}`,
        },
        () => {
          if (subjectContainer.innerHTML !== latestArticleName) {
            chrome.storage.local.set({
              articleLinkHref: articleLinkHref, // Set the articleLinkHref to local storage
              outputLog: `<a href="${articleLinkHref}">Ny annons inlagd</a>`, // Set the output log to the new article
            });
          } else {
            setTimeout(() => {
              chrome.storage.local.set({
                outputLog: "Ingen ny annons hittad, uppdaterar...",
              });
            }, 500);
          }
        }
      );
    }
  }
  // Increment the value of `i` and store it in `chrome.storage`
  setTimeout(() => {
    i++;
    chrome.storage.local.set({ currentValue: i });
    location.reload();
  }, randomDelay); // Random delay between 3-5 seconds
}

// Inject the script into the current tab
function injectScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: injectBlocket,
    });
  });
}

// Watch over the value of `currentValue` and refresh the script if it doesn't change
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
        chrome.storage.local.set(
          {
            refreshedAutomatically: true,
            outputLog: "Unknown bug occurred, refreshing...",
          },
          () => {
            location.reload();
          }
        );
      }
    });
  }, 25000);
}

// Send a message to a Discord webhook
function sendDiscordMessage(content) {
  fetch(discordWebHook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: content,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Message sent successfully");
      } else {
        console.error("Failed to send message", response.statusText);
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Play the decided soundfile
function playAudioNotice() {
  if (activateSilentMode.checked) {
    silentTriggerAudio.play(); // play the sound from the soundfile "silent-trigger.mp3"
  } else {
    triggerAudio.play(); // play the sound from the soundfile "trigger.ogg"
  }
}

// Add event listeners to the buttons
function listenToInputs() {
  document
    .getElementById("blocket-sniper-inject-script")
    .addEventListener("click", (e) => {
      chrome.storage.local.set(
        {
          currentValue: 0,
          outputLog: "Blocket Sniper Injected",
        },
        () => {
          targetElement.innerHTML = 0;
        }
      );
      injectScript();
      watchOverEverything();
    });
  // Add event listener to the reset button to reset the value of `i` to 0
  document
    .getElementById("blocket-sniper-reset-counter")
    .addEventListener("click", (e) => {
      chrome.storage.local.set({
        currentValue: 0,
        outputLog: "Manually reset counter",
      });
      sendDiscordMessage("Manually reset counter");
      location.reload();
    });
  // Add event listener to the silent mode checkbox
  activateSilentMode.addEventListener("click", (e) => {
    if (activateSilentMode.checked) {
      chrome.storage.local.set({
        isSilentMode: true,
        outputLog: "Silent mode activated",
      });
    } else {
      chrome.storage.local.set({
        isSilentMode: false,
        outputLog: "Silent mode deactivated",
      });
    }
  });
}
listenToInputs(); // Listen to the inputs

// Listen for changes in `currentValue` and re-inject script after a delay
function onStorageChange() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    // Re-inject the script if `currentValue` changes
    if (changes.currentValue) {
      chrome.storage.local.get(["currentValue"], (result) => {
        const currentValue = result.currentValue || 0; // Default to 0 if `currentValue` is undefined
        targetElement.innerHTML = currentValue;
        if (currentValue >= 50) {
          chrome.storage.local.set(
            {
              refreshedAutomatically: true,
              outputLog:
                "Reached 50 resets, reloading extension and resetting counter",
            },
            () => {}
          );
          chrome.storage.local.set({ currentValue: 0 });
          location.reload();
        }
      });
      setTimeout(() => {
        injectScript();
        watchOverEverything();
      }, 3000);
    }
    // Play the sound and open the article in a new tab if `latestArticleName` changes
    if (changes.latestArticleName) {
      playAudioNotice(); // Play the sound
      let articleLinkHref;
      chrome.storage.local.get(["articleLinkHref"], (result) => {
        if (result.articleLinkHref) {
          // Open articleLinkHref in a new tab, unfocused to not interrupt the script
          articleLinkHref = result.articleLinkHref;
          sendDiscordMessage(
            `Ny annons inlagd: ${articleLinkHref} <@104757504541515776>`
          );
          chrome.windows.create({ url: articleLinkHref, focused: false }); // Open it in a new window
        }
      });
    }

    if (changes.outputLog) {
      outputLog.innerHTML = changes.outputLog.newValue;
    }
  });
}
onStorageChange(); // Listen for changes in storage
