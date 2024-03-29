//go:build writegob

package geolocator

import (
	"bytes"
	_ "embed"
	"encoding/gob"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/paulmach/orb"
	"github.com/paulmach/orb/geojson"
)

var (
	//go:embed embeds/congress-2018.geojson
	congress2018 []byte
	//go:embed embeds/congress-2022.geojson
	congress2022 []byte
	//go:embed embeds/house-2012.geojson
	house2012 []byte
	//go:embed embeds/senate-2012.geojson
	senate2012 []byte
	//go:embed embeds/house-2022.geojson
	house2022 []byte
	//go:embed embeds/senate-2022.geojson
	senate2022 []byte
	//go:embed embeds/pennsylvania-counties.geojson
	counties []byte
)

var (
	Congress2018Map = geojson2Map(congress2018, "embeds/congress-2018.gob", true)
	Congress2022Map = geojson2Map(congress2022, "embeds/congress-2022.gob", false)
	House2012Map    = geojson2Map(house2012, "embeds/house-2012.gob", false)
	House2022Map    = geojson2Map(house2022, "embeds/house-2022.gob", false)
	Senate2012Map   = geojson2Map(senate2012, "embeds/senate-2012.gob", false)
	Senate2022Map   = geojson2Map(senate2022, "embeds/senate-2022.gob", false)
	CountiesMap     = geojson2Map(counties, "embeds/pennsylvania-counties.gob", false)
)

func geojson2Map(b []byte, name string, newstyle bool) Map {
	fc, err := geojson.UnmarshalFeatureCollection(b)
	if err != nil {
		panic(err)
	}

	ds := make(Map, len(fc.Features))
	for i, f := range fc.Features {
		var dist string
		if v, ok := f.Properties["DISTRICT"]; ok {
			dist = v.(string)
		} else if v, ok := f.Properties["District_1"]; ok {
			dist = v.(string)
		} else if v, ok := f.Properties["LEG_DISTRICT_NO"]; ok {
			n := v.(float64)
			dist = strconv.Itoa(int(n))
		} else if v, ok := f.Properties["county_nam"]; ok {
			dist = strings.Title(strings.ToLower(v.(string)))
		}

		if dist == "" {
			panic(fmt.Sprintf("%d %s", i, name))
		}

		mgon, ok := f.Geometry.(orb.MultiPolygon)
		if !ok {
			poly := f.Geometry.(orb.Polygon)
			mgon = []orb.Polygon{poly}
		}
		if len(mgon[0]) < 1 {
			panic(name + "-" + dist)
		}
		bound := mgon[0][0].Bound()
		for _, poly := range mgon {
			for _, ring := range poly {
				bound = bound.Union(ring.Bound())
			}
		}
		ds[i] = District{
			Name:         dist,
			MultiPolygon: mgon,
			Bound:        bound,
			NewStyle:     newstyle,
		}
	}
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	if err = enc.Encode(ds); err != nil {
		panic(err)
	}
	if err = os.WriteFile(name, buf.Bytes(), 0644); err != nil {
		panic(err)
	}
	return ds
}
