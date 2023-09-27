package geolocator

import (
	_ "embed"
	"encoding/json"
)

type Candidate struct {
	Name  string `json:"name"`
	Party string `json:"party"`
}

var (
	CanCommonPleas       map[string][]Candidate
	CanCommonwealthCourt map[string][]Candidate
	CanSuperiorCourt     map[string][]Candidate
	CanSupremeCourt      []Candidate
)

//go:embed embeds/candidates.json
var canData []byte

func init() {
	var candidates map[string]map[string][]Candidate
	err := json.Unmarshal(canData, &candidates)
	if err != nil {
		panic(err)
	}
	CanCommonwealthCourt = candidates["Judge of the Commonwealth Court"]
	CanCommonPleas = candidates["Judge of the Court Common Pleas"]
	CanSuperiorCourt = candidates["Judge of the Superior Court"]
	CanSupremeCourt = candidates["Justice of the Supreme Court"][""]
}
