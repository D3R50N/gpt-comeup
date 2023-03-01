/**
 * @returns l'onglet actif de chrome
 */

var current_tab;
var out;
async function getCurrentTab() {
  let queryOptions = {
    active: true,
    lastFocusedWindow: true,
  };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

getCurrentTab().then((tab) => {
  current_tab = tab;
  run();
});

function main() {
  var receiver_messages = document.querySelectorAll(
    ".trackingChat-item.receiver"
  );

  return receiver_messages[receiver_messages.length - 1].textContent;
}

// Fonction pour récupérer la clé d'API depuis un fichier de configuration externe
function getApiKey() {
  return fetch("/config.json")
    .then((response) => response.json())
    .then((config) => config.apiKey);
}

// Fonction pour envoyer une requête à l'API GPT-3
async function generateResponse(prompt) {
  const apiKey = await getApiKey();
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: `Tu es maintenant un développeur. Un client t'zenvoie ceci "${prompt}" et te demande de lui répondre.`,
      max_tokens: 128,
      n: 1,
      // stop: "\n",
      temperature: 1,
    }),
  });
  const result = await response.json();
  // console.log(result);
  return result.choices[0].text;
}

// Fonction pour gérer les événements de clic sur le bouton
function handleClick(prompt) {
  document.getElementById("output").innerHTML =
    "<i>Chargement de la réponse...</i>";
  generateResponse(prompt).then((response) => {
    out = response;
    document.getElementById("output").innerHTML =
      "<b>Réponse générée</b> : <br>" + response;
    document.getElementById("btn_copy").removeAttribute("disabled");
    document.getElementById("btn").removeAttribute("disabled");
  });
}

// Ajout d'un écouteur d'événement pour le clic sur le bouton
document.getElementById("btn").addEventListener("click", run);

function run() {
  document.getElementById("btn").setAttribute("disabled", "disabled");
  document.getElementById("btn_copy").setAttribute("disabled", "disabled");
  chrome.scripting
    .executeScript({
      target: { tabId: current_tab.id },
      function: main,
    })
    .then((out) => {
      if (!out[0].result) {
        document.getElementById("input").innerHTML =
          "<b>Dernier message du client</b> : <br> Aucun message";
        document.getElementById("btn").removeAttribute("disabled");
        document.getElementById("output").innerHTML =
          "<b>Réponse générée</b> : <br> Aucun message";
        return;
      }
      document.getElementById("input").innerHTML =
        "<b>Dernier message du client</b> : <br>" + out[0].result;
      handleClick(out[0].result);
    });
}

document.getElementById("btn_copy").addEventListener("click", () => {
  chrome.scripting.executeScript({
    target: { tabId: current_tab.id },
    function: set_message,
    args: [out.trim()],
  });
});

function set_message(message) {
  document.getElementById("chat_message_body").value = message;
  
  document.getElementById("chat_message_body").style.height = "300px";
  document.getElementById("chat_message_body").style.overflow = "hidden scroll";
}
