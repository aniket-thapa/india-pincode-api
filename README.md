# All India Pincode API

A fast, free, open-source REST API providing comprehensive postal data for every pin code in India — built entirely on **static JSON files** hosted via GitHub Pages. No server, no rate limits, no API keys.

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
![Data Source](https://img.shields.io/badge/Data%20Source-data.gov.in-blue)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

> **Data source:** Official Department of Posts dataset via [data.gov.in](https://data.gov.in)

---

## Table of Contents

- [Base URL](#base-url)
- [API Reference](#api-reference)
  - [List All States & UTs](#1-list-all-states--uts)
  - [State Detail](#2-state-detail)
  - [District Detail](#3-district-detail)
  - [Pincode Lookup](#4-pincode-lookup)
- [Field Reference](#field-reference)
- [Slug Convention](#slug-convention)
- [Code Examples](#code-examples)
  - [JavaScript / Fetch](#javascript--fetch)
  - [Python](#python)
  - [curl](#curl)
- [Notes & Caveats](#notes--caveats)
- [License](#license)

---

## Base URL

```
https://aniket-thapa.github.io/india-pincode-api
```

All endpoints are plain `GET` requests. CORS is enabled by default on GitHub Pages, so you can call these directly from a browser or any frontend app.

---

## API Reference

### 1. List All States & UTs

Returns a sorted array of every state and union territory along with summary counts.

```
GET /states.json
```

**Response**

```json
[
  {
    "name": "ANDHRA PRADESH",
    "slug": "andhra-pradesh",
    "districtCount": 26,
    "officeCount": 8143
  },
  {
    "name": "TELANGANA",
    "slug": "telangana",
    "districtCount": 33,
    "officeCount": 4210
  }
]
```

| Field           | Type     | Description                                                   |
| --------------- | -------- | ------------------------------------------------------------- |
| `name`          | `string` | Official state / UT name in uppercase                         |
| `slug`          | `string` | URL-safe identifier (see [Slug Convention](#slug-convention)) |
| `districtCount` | `number` | Number of districts in this state                             |
| `officeCount`   | `number` | Total post offices across all districts                       |

---

### 2. State Detail

Returns state metadata and an alphabetically sorted list of its districts.

```
GET /states/{state-slug}.json
```

**Example**

```
GET /states/telangana.json
```

**Response**

```json
{
  "name": "TELANGANA",
  "slug": "telangana",
  "districtCount": 33,
  "districts": [
    {
      "name": "HANUMAKONDA",
      "slug": "hanumakonda",
      "officeCount": 87
    },
    {
      "name": "KUMURAM BHEEM ASIFABAD",
      "slug": "kumuram-bheem-asifabad",
      "officeCount": 63
    }
  ]
}
```

| Field                     | Type     | Description                             |
| ------------------------- | -------- | --------------------------------------- |
| `name`                    | `string` | Official state name in uppercase        |
| `slug`                    | `string` | URL-safe slug for this state            |
| `districtCount`           | `number` | Total number of districts               |
| `districts`               | `array`  | Sorted list of district summary objects |
| `districts[].name`        | `string` | Official district name in uppercase     |
| `districts[].slug`        | `string` | URL-safe slug for this district         |
| `districts[].officeCount` | `number` | Number of post offices in this district |

---

### 3. District Detail

Returns every post office in a district, including the pincode each office belongs to.

```
GET /districts/{state-slug}/{district-slug}.json
```

**Example**

```
GET /districts/telangana/kumuram-bheem-asifabad.json
```

**Response**

```json
{
  "state": "TELANGANA",
  "stateSlug": "telangana",
  "district": "KUMURAM BHEEM ASIFABAD",
  "districtSlug": "kumuram-bheem-asifabad",
  "offices": [
    {
      "officeName": "Kothimir B.O",
      "officeType": "BO",
      "deliveryStatus": "Delivery",
      "circleName": "Telangana Circle",
      "regionName": "Hyderabad Region",
      "divisionName": "Adilabad Division",
      "pincode": "504273",
      "latitude": 19.3638689,
      "longitude": 79.5376658
    },
    {
      "officeName": "Kukuda B.O",
      "officeType": "BO",
      "deliveryStatus": "Delivery",
      "circleName": "Telangana Circle",
      "regionName": "Hyderabad Region",
      "divisionName": "Adilabad Division",
      "pincode": "504299",
      "latitude": null,
      "longitude": null
    }
  ]
}
```

| Field               | Type     | Description                                 |
| ------------------- | -------- | ------------------------------------------- |
| `state`             | `string` | State name                                  |
| `stateSlug`         | `string` | State slug                                  |
| `district`          | `string` | District name                               |
| `districtSlug`      | `string` | District slug                               |
| `offices`           | `array`  | All post offices in this district           |
| `offices[].pincode` | `string` | 6-digit pincode this office is listed under |

For all office fields, see [Field Reference → Office Object](#office-object).

---

### 4. Pincode Lookup

Returns every post office listed under a specific 6-digit pincode.

```
GET /pincodes/{pincode}.json
```

**Example**

```
GET /pincodes/504273.json
```

**Response**

```json
{
  "state": "TELANGANA",
  "district": "KUMURAM BHEEM ASIFABAD",
  "offices": [
    {
      "officeName": "Kothimir B.O",
      "officeType": "BO",
      "deliveryStatus": "Delivery",
      "circleName": "Telangana Circle",
      "regionName": "Hyderabad Region",
      "divisionName": "Adilabad Division",
      "latitude": 19.3638689,
      "longitude": 79.5376658
    }
  ]
}
```

> The `pincode` field is omitted here since it is already encoded in the filename.

---

## Field Reference

### Office Object

| Field            | Type             | Description                                              |
| ---------------- | ---------------- | -------------------------------------------------------- |
| `officeName`     | `string`         | Name of the post office or branch                        |
| `officeType`     | `string`         | `HO`, `SO`, or `BO` — see table below                    |
| `deliveryStatus` | `string`         | `"Delivery"` or `"Non Delivery"`                         |
| `circleName`     | `string`         | Postal circle (e.g. `"Telangana Circle"`)                |
| `regionName`     | `string`         | Postal region within the circle                          |
| `divisionName`   | `string`         | Postal division within the region                        |
| `latitude`       | `number \| null` | WGS-84 latitude; `null` when unavailable in source data  |
| `longitude`      | `number \| null` | WGS-84 longitude; `null` when unavailable in source data |
| `pincode`        | `string`         | _(District endpoint only)_ 6-digit pincode               |

### Office Types

| Code | Full Name     | Description                                                   |
| ---- | ------------- | ------------------------------------------------------------- |
| `HO` | Head Office   | Primary post office of a region; handles sorting and dispatch |
| `SO` | Sub Office    | Reports to a Head Office; serves a local area                 |
| `BO` | Branch Office | Reports to a Sub Office; usually a small rural outlet         |

---

## Slug Convention

State and district names are converted to lowercase, hyphen-separated slugs for use in URLs:

1. Trim whitespace
2. Convert to lowercase
3. Replace any sequence of non-alphanumeric characters with a single `-`
4. Strip leading and trailing hyphens

**Examples**

| Original Name            | Slug                     |
| ------------------------ | ------------------------ |
| `UTTAR PRADESH`          | `uttar-pradesh`          |
| `JAMMU & KASHMIR`        | `jammu-kashmir`          |
| `KUMURAM BHEEM ASIFABAD` | `kumuram-bheem-asifabad` |
| `RAJANNA SIRCILLA`       | `rajanna-sircilla`       |
| `DELHI`                  | `delhi`                  |

---

## Code Examples

### JavaScript / Fetch

```js
const BASE = 'https://aniket-thapa.github.io/india-pincode-api';

// 1. Get all states
const states = await fetch(`${BASE}/states.json`).then((r) => r.json());

// 2. Get all districts of a state
const state = await fetch(`${BASE}/states/telangana.json`).then((r) =>
  r.json(),
);
console.log(state.districts); // [{name, slug, officeCount}, ...]

// 3. Get all offices in a district
const district = await fetch(
  `${BASE}/districts/telangana/kumuram-bheem-asifabad.json`,
).then((r) => r.json());
console.log(district.offices.length);

// 4. Look up a pincode
const pin = await fetch(`${BASE}/pincodes/504273.json`).then((r) => r.json());
console.log(pin.state); // "TELANGANA"
console.log(pin.district); // "KUMURAM BHEEM ASIFABAD"

// Filter only delivery offices
const delivery = pin.offices.filter((o) => o.deliveryStatus === 'Delivery');

// Filter offices with known coordinates
const mapped = pin.offices.filter((o) => o.latitude !== null);
```

### Python

```python
import requests

BASE = "https://aniket-thapa.github.io/india-pincode-api"

# Get all states
states = requests.get(f"{BASE}/states.json").json()

# Get districts of a state
state = requests.get(f"{BASE}/states/telangana.json").json()
print(state["districtCount"])  # 33

# Get all offices in a district
district = requests.get(
    f"{BASE}/districts/telangana/kumuram-bheem-asifabad.json"
).json()

# Look up a pincode
pin = requests.get(f"{BASE}/pincodes/504273.json").json()
print(pin["district"])  # KUMURAM BHEEM ASIFABAD

# Filter only delivery offices
delivery_offices = [o for o in pin["offices"] if o["deliveryStatus"] == "Delivery"]

# Filter offices with known coordinates
mapped_offices = [o for o in pin["offices"] if o["latitude"] is not None]
```

### curl

```bash
# All states
curl https://aniket-thapa.github.io/india-pincode-api/states.json

# State detail
curl https://aniket-thapa.github.io/india-pincode-api/states/telangana.json

# District detail
curl https://aniket-thapa.github.io/india-pincode-api/districts/telangana/hanumakonda.json

# Pincode lookup
curl https://aniket-thapa.github.io/india-pincode-api/pincodes/504273.json

# Pretty-print with jq
curl -s https://aniket-thapa.github.io/india-pincode-api/pincodes/110001.json | jq .
```

---

## Notes & Caveats

**`null` coordinates** — Some offices in the source data have `NA` for latitude/longitude. These are stored as JSON `null`. Always null-check before using coordinates:

```js
if (office.latitude !== null) {
  plotOnMap(office.latitude, office.longitude);
}
```

**Multiple offices per pincode** — A single pincode commonly maps to many post offices (one Head Office and several Sub/Branch Offices). Always iterate `offices[]` rather than assuming a single result.

**One district, many pincodes** — A district spans multiple pincodes, which is why district-level files include a `pincode` field per office. Pincode files omit this field since it is encoded in the filename itself.

**Data accuracy** — This API mirrors the official dataset as-is. Occasional inconsistencies in spelling, naming, or coordinates exist in the upstream source and are preserved faithfully.

**Casing** — State and district `name` fields are always uppercase. Slugs are always lowercase.

---

## License

**All India Pincode JSON API** © 2026 by Aniket Thapa is licensed under
[Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to use and adapt this data for non-commercial purposes with attribution.
For commercial use, please contact the author.
