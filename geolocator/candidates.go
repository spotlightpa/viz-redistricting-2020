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
	CanGov               []Candidate
	CanUSSenate          []Candidate
	CanUSHouse           map[string][]Candidate
	CanPAHouse           map[string][]Candidate
	CanPASenate          map[string][]Candidate
	CanCommonwealthCourt map[string][]Candidate
)

//go:embed embeds/candidates.json
var canData []byte

func init() {
	var candidates map[string]map[string][]Candidate
	err := json.Unmarshal(canData, &candidates)
	if err != nil {
		panic(err)
	}
	CanGov = candidates["Governor"][""]
	CanUSSenate = candidates["US Senate"][""]
	CanUSHouse = candidates["US House"]
	CanPAHouse = candidates["State House"]
	CanPASenate = candidates["State Senate"]
	CanCommonwealthCourt = candidates["Judge of the Commonwealth Court"]
}
