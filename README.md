# All India Pincode API

A fast, static, open-source REST API providing comprehensive postal data for India, generated from the official Department of Posts dataset.

## Base URL

`https://aniket-thapa.github.io/india-pincode-api/pincodes/`

## Usage

To get data for a specific pincode, simply append `[pincode].json` to the base URL. This supports standard `GET` requests and has CORS enabled by default.

### Example Request

```bash
curl https://aniket-thapa.github.io/india-pincode-api/pincodes/504273.json
```
