const URL = "https://scene-stamp-server.herokuapp.com";

document.addEventListener("keypress", keyHandler);
let currVideo = null;
let episode_id = null;
let link = null;
let container = null;
let currentElement = null;
let data = {};
let currTimestamp = null;
let controlCat = null;
let controlChar = null;

window.onpopstate = function(e) {
  debugger;
  prefillData(window.location.href);
};

var pushState = history.pushState;
history.pushState = function() {
  pushState.apply(history, arguments);
  fireEvents("pushState", arguments); // Some event-handling function
};

function prefillData(link) {
  fetch(URL + "/getEpisodeData?youtube_link=" + link)
    .then(resp => resp.json())
    .then(function(data) {
      if (data.length === 0) {
        createToast();
      } else {
        episode_id = data[0].episode_id;
        createSuccessToast(data[0].episode_id);
      }
    });
}

function createSuccessToast(id) {
  let container = document.getElementById("info-contents");
  const outerDiv = document.createElement("DIV");
  outerDiv.classList.add("scene-stamp-toast");

  const firstDiv = document.createElement("DIV");
  firstDiv.innerText = "Show Timestamps";
  firstDiv.onclick = function() {
    getTimestamps(id);
    dismissToast(container, outerDiv);
  };

  const secondDiv = document.createElement("DIV");
  secondDiv.innerText = "Dismiss";
  secondDiv.onclick = function() {
    dismissToast(container, outerDiv);
  };

  outerDiv.appendChild(firstDiv);
  outerDiv.appendChild(secondDiv);
  container.appendChild(outerDiv);
}

function dismissToast(container, outer) {
  container.removeChild(outer);
}

function createToast() {
  let container = document.getElementById("info-contents");
  const outerDiv = document.createElement("DIV");
  outerDiv.classList.add("scene-stamp-toast");

  const firstDiv = document.createElement("DIV");
  firstDiv.innerText = "Create Episode?";
  firstDiv.onclick = function() {
    createEpisodeMediate();
    dismissToast(container, outerDiv);
  };

  const secondDiv = document.createElement("DIV");
  secondDiv.innerText = "Dismiss";
  secondDiv.onclick = function() {
    dismissToast(container, outerDiv);
  };

  outerDiv.appendChild(firstDiv);
  outerDiv.appendChild(secondDiv);
  container.appendChild(outerDiv);
}

function createEpisodeMediate() {
  currVideo = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];
  const container = document.getElementsByClassName(
    "ytd-video-primary-info-renderer"
  )[0];
  if (container === undefined || currVideo == null) {
    alert("The page has not loaded yet please try again soon!");
  } else {
    createEpisode();
  }
}

function keyHandler(e) {
  if (e.keyCode === 112 && notFocusing()) {
    if (currVideo) {
      addTimestamp(Math.floor(currVideo.currentTime));
    } else {
      currVideo = document.getElementsByClassName(
        "video-stream html5-main-video"
      )[0];
      if (currVideo) {
        addTimestamp(Math.floor(currVideo.currentTime));
      }
    }
  }
}

function notFocusing() {
  return (
    document.activeElement.id != "scene-stamp-categories-selectized" ||
    document.activeElement.id != "scene-stamp-characters-selectized"
  );
}

function createEpisode() {
  const episode_name = document.getElementsByClassName(
    "style-scope ytd-video-primary-info-renderer"
  )[0].children[3].textContent;
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "createEpisode",
      name: episode_name.replace(/,/g, ""),
      link: window.location.href
    },
    function(response) {
      episode_id = response.episode_id;
      renderBar([]);
    }
  );
}

function markerLocation(time) {
  return (Math.floor(time) / Math.floor(currVideo.duration)) * 100;
}

function leftToTime(ratio) {
  return (ratio / 100) * Math.floor(currVideo.duration);
}

function openModal(element) {
  const position = leftToTime(
    parseFloat(
      element.target.style.left.substring(
        0,
        element.target.style.left.length - 1
      )
    )
  );
  currVideo.currentTime = position;
  if (currentElement == null) {
    currentElement = element.target;
  } else {
    if (currentElement == element.target) {
      return;
    }
    currentElement.classList.remove("scene-stamp-active-marker");
    currentElement = element.target;
  }
  element.target.classList.add("scene-stamp-active-marker");
  loadMarkerData(element.target.dataset.id);
}

function loadMarkerData(id) {
  let chars = controlChar[0].selectize;
  let cats = controlCat[0].selectize;
  let dataObj = data[id];
  chars.clear();
  cats.clear();
  for (let i = 0; i < dataObj.categories.length; i++) {
    cats.addItem(dataObj.categories[i]);
  }
  for (let i = 0; i < dataObj.characters.length; i++) {
    chars.addItem(dataObj.characters[i]);
  }
}

function renderBar(markers) {
  container = document.getElementById("info-contents");
  const bar = document.createElement("div");
  const modal = createModal();
  bar.classList.add("scene-stamp-nav-bar");

  for (let i = 0; i < markers.length; i++) {
    data[markers[i].timestamp_id] = {
      categories: markers[i].categories,
      characters: markers[i].characters,
      time: markers[i].start_time,
      id: episode_id
    };
    let marker = document.createElement("div");
    marker.classList.add("marker");
    marker.style.left = markerLocation(markers[i].start_time) + "%";
    marker.dataset.id = markers[i].timestamp_id;
    marker.onclick = openModal;
    bar.appendChild(marker);
  }
  if (
    document.getElementsByClassName("scene-stamp-nav-bar").length != null &&
    document.getElementsByClassName("scene-stamp-nav-bar").length < 1
  ) {
    container.insertBefore(modal, container.firstChild);
    container.insertBefore(bar, container.firstChild);
    getCatAndChars();
  }
}

function createModal() {
  const modal = document.createElement("div");
  const save = document.createElement("button");
  save.textContent = "Save";

  save.classList.add("scene-stamp-save-btn");
  save.onclick = saveTimestamp;

  const inputContainerCat = document.createElement("div");
  inputContainerCat.classList.add("scene-inputs-container");
  const inputContainerChar = document.createElement("div");
  inputContainerChar.classList.add("scene-inputs-container");

  const inputCategories = document.createElement("input");
  inputCategories.type = "text";
  inputCategories.id = "scene-stamp-categories";
  const inputCharacters = document.createElement("input");
  inputCharacters.type = "text";
  inputCharacters.id = "scene-stamp-characters";

  inputContainerCat.appendChild(inputCharacters);
  inputContainerChar.appendChild(inputCategories);

  modal.classList.add("scene-stamp-modal");
  modal.appendChild(inputContainerCat);
  modal.appendChild(inputContainerChar);
  modal.appendChild(save);
  return modal;
}

function saveTimestamp(e) {
  let timestamp_id = currentElement.dataset.id;
  let chars = controlChar[0].selectize;
  let cats = controlCat[0].selectize;
  let charIds = chars.getValue();
  let catIds = cats.getValue();
  data[timestamp_id].characters = chars.items;
  data[timestamp_id].categories = cats.items;
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "updateTimestamp",
      id: timestamp_id,
      chars: charIds,
      cats: catIds
    },
    function(response) {}
  );
}

function getCatAndChars() {
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "getCategories"
    },
    function(response) {
      for (let i = 1; i < response.length + 1; i++) {
        response[i - 1].value = response[i - 1].category_id;
      }
      controlCat = $("#scene-stamp-categories").selectize({
        options: response,
        delimiter: ",",
        persist: false,
        placeholder: "Add Categories...",
        labelField: "category_name",
        searchField: ["category_name"],
        create: function(input, callback) {
          chrome.runtime.sendMessage(
            {
              contentScriptQuery: "newCategory",
              name: input
            },
            function(response) {
              callback({
                value: response.category_id,
                category_id: response.category_id,
                category_name: response.category_name
              });
            }
          );
        }
      });
    }
  );
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "getCharacters"
    },
    function(response) {
      for (let i = 1; i < response.length + 1; i++) {
        response[i - 1].value = response[i - 1].character_id;
      }
      controlChar = $("#scene-stamp-characters").selectize({
        options: response,
        delimiter: ",",
        persist: false,
        placeholder: "Add Characters...",
        labelField: "character_name",
        searchField: ["character_name"],
        create: function(input, callback) {
          chrome.runtime.sendMessage(
            {
              contentScriptQuery: "newCharacter",
              name: input
            },
            function(response) {
              callback({
                value: response.character_id,
                character_id: response.character_id,
                character_name: response.character_name
              });
            }
          );
        }
      });
    }
  );
}

function getTimestamps(id) {
  let timestamps = 0;
  currVideo = document.getElementsByClassName(
    "video-stream html5-main-video"
  )[0];
  const container = document.getElementsByClassName(
    "ytd-video-primary-info-renderer"
  )[0];
  if (container === undefined || currVideo == null) {
    alert("The page has not loaded yet please try again soon!");
  } else {
    fetch(URL + "/getTimestampData?episode_ids=" + id)
      .then(resp => resp.json())
      .then(function(data) {
        renderBar(data);
      });
  }
}

function addTimestamp(endTime) {
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "addTimestamp",
      id: episode_id,
      time: endTime
    },
    function(response) {
      addMarker(response);
    }
  );
}

function addMarker(timestamp) {
  data[timestamp.timestamp_id] = {
    categories: [],
    characters: [],
    time: timestamp.start_time,
    id: episode_id
  };
  const bar = document.getElementsByClassName("scene-stamp-nav-bar")[0];
  let marker = document.createElement("div");
  marker.classList.add("marker");
  marker.style.left = markerLocation(timestamp.start_time) + "%";
  marker.dataset.id = timestamp.timestamp_id;
  marker.onclick = openModal;
  bar.appendChild(marker);
}
