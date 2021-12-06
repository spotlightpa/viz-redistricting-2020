import Alpine from "alpinejs/src/index.js";

import { initFrameAndPoll } from "@newswire/frames";

import { onLoad } from "./utils/dom-utils.js";
import { addGAListeners } from "./utils/google-analytics.js";

import * as L from "leaflet";

import * as params from "@params";

const locate = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );

Alpine.store("state", {
  oldHouse: "103",
  newHouse: "103",
  oldSenate: "15",
  newSenate: "15",

  lat: 40.26444,
  long: -76.88375,

  get latLong() {
    return [this.lat, this.long];
  },

  update(json) {
    let { address, lat, long, old_house, new_house, old_senate, new_senate } =
      json;

    this.address = address || this.address;
    this.lat = lat || this.lat;
    this.long = long || this.long;
    this.oldHouse = old_house || this.oldHouse;
    this.newHouse = new_house || this.newHouse;
    this.oldSenate = old_senate || this.oldSenate;
    this.newSenate = new_senate || this.newSenate;
    if (
      ![old_house, new_house, old_senate, new_senate].every((item) => !!item)
    ) {
      throw new Error("District could not be found.");
    }
  },
});

Alpine.data("app", () => {
  return {
    error: null,

    isLoading: false,
    recentlyChanged: false,

    init() {
      let timeoutID = null;
      this.$watch("isLoading", (val) => {
        if (val) {
          this.recentlyChanged = true;
          window.clearTimeout(timeoutID);
          timeoutID = window.setTimeout(() => {
            this.recentlyChanged = false;
          }, 1000);
        }
      });
    },

    get isLoadingThrottled() {
      return this.isLoading || this.recentlyChanged;
    },

    async byAddress() {
      if (this.isLoading || !this.$store.state.address) {
        return;
      }
      return this.callAPI(
        "/api/by-address?address=" +
          encodeURIComponent(this.$store.state.address)
      );
    },

    async byLocation() {
      if (this.isLoading) {
        return;
      }

      try {
        let { coords } = await locate();
        this.$store.state.lat = coords.latitude;
        this.$store.state.long = coords.longitude;
      } catch (e) {
        this.error = e;
        return;
      }
      return this.callAPI(
        "/api/by-location?lat=" +
          encodeURIComponent(this.$store.state.lat) +
          "&long=" +
          encodeURIComponent(this.$store.state.long)
      );
    },
    async callAPI(path) {
      this.isLoading = true;
      await fetch(params.apiBaseURL + path)
        .then((rsp) => rsp.json())
        .then((json) => {
          if (json.error_message) {
            throw Error(json.error_message);
          }
          this.error = null;
          this.$store.state.update(json);
        })
        .catch((e) => {
          this.error = e;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
});

Alpine.data("map", () => {
  return {
    map: null,
    latLong: null,
    marker: null,
    layer: null,
    geojson: "",
    props: null,

    init() {
      this.map = L.map(this.$refs.leaflet).setView(
        [this.$store.state.lat, this.$store.state.long],
        12
      );
      this.map.createPane("labels");
      this.map.getPane("labels").style.zIndex = 650;
      this.map.getPane("labels").style.pointerEvents = "none";
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 12,
        }
      ).addTo(this.map);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 12,
          pane: "labels",
        }
      ).addTo(this.map);

      this.$watch("latLong", (latLong) => {
        if (this.marker) this.marker.remove();

        this.marker = L.marker(latLong);
        this.marker.addTo(this.map);

        this.map.flyTo(latLong);
      });

      this.$watch("geojson", async (url) => {
        let geojsonFeature;
        try {
          geojsonFeature = await fetch(url).then((rsp) => rsp.json());
        } catch (e) {
          this.error = e;
          return;
        }
        if (this.layer) this.layer.remove();
        let layer = L.geoJSON(geojsonFeature);
        this.layer = layer;
        this.props = geojsonFeature.features[0].properties;
        layer.bindPopup(() => `District ${this.props.district}`);
        layer.addTo(this.map);
        this.map.flyToBounds(layer.getBounds());
      });
    },
  };
});

Alpine.start();

initFrameAndPoll();

onLoad(() => {
  addGAListeners();
});
