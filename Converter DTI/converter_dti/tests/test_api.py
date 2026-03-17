from fastapi.testclient import TestClient

from converter_dti.api.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "converter-dti"}


def test_version():
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["protocol"] == "DKP-0-TIME-001"


def test_gregorian_to_dti_endpoint():
    response = client.post("/convert/gregorian-to-dti", json={"year": 2026, "month": 1, "day": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["jdn"] == 2461043
    assert body["dti"]["dy"] == 6836
    assert body["dti"]["doy"] == 84
    assert body["dti"]["canonical"] == "DY6836-084"


def test_dti_to_gregorian_endpoint():
    response = client.post("/convert/dti-to-gregorian", json={"dy": 6836, "doy": 84})
    assert response.status_code == 200
    body = response.json()
    assert body["jdn"] == 2461043
    assert body["gregorian"]["iso"] == "2026-01-02"


def test_invalid_dti_rejected():
    response = client.post("/convert/dti-to-gregorian", json={"dy": 6836, "doy": 361})
    assert response.status_code == 422


def test_invalid_gregorian_year_zero():
    response = client.post("/convert/gregorian-to-dti", json={"year": 0, "month": 1, "day": 1})
    assert response.status_code == 400
