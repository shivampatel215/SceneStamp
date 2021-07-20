const URL = "https://scene-stamp-server.herokuapp.com";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.contentScriptQuery == "createEpisode") {
    fetch(
      URL +
        "/newEpisode?episode_name=" +
        request.name +
        "&youtube_link=" +
        request.link
    )
      .then(response => response.json())
      .then(data => sendResponse(data));
    return true; // Will respond asynchronously.
  } else if (request.contentScriptQuery == "getEpisodeData") {
    fetch(URL + "/getEpisodeData?youtube_link=" + request.link)
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "getTimestampData") {
    debugger;
    fetch(URL + "/getTimestampData?episode_ids=" + request.id)
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "addTimestamp") {
    fetch(
      URL +
        "/newTimestamp?start_time=" +
        request.time +
        "&episode_id=" +
        request.id
    )
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "getCategories") {
    fetch(URL + "/getCategoryData")
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "getCharacters") {
    fetch(URL + "/getCharacterData")
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "updateTimestamp") {
    let params = "timestamp_id=" + request.id;
    if (request.chars.length > 0) {
      params += "&character_ids=" + request.chars.trim();
    } else {
      params += "&clearCharacters=true";
    }
    if (request.cats.length > 0) {
      params += "&category_ids=" + request.cats.trim();
    } else {
      params += "&clearCategories=true";
    }
    fetch(URL + "/updateTimestamp?" + params).then(sendResponse(true));
    return true;
  } else if (request.contentScriptQuery == "newCategory") {
    fetch(URL + "/newCategory?category_name=" + request.name)
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  } else if (request.contentScriptQuery == "newCharacter") {
    fetch(URL + "/newCharacter?character_name=" + request.name)
      .then(resp => resp.json())
      .then(data => sendResponse(data));
    return true;
  }
});
