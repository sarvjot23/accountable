"""Organization routes and field rules (DATA-1, DATA-2, API-1, API-2)."""

from datetime import UTC, date, datetime, timedelta


def test_create_and_get(client):  # API-2 DATA-2
    response = client.post(
        "/api/organizations",
        json={"name": "  Meridian Health ", "website": "meridian.health", "industry": "Healthcare", "notes": "Big"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Meridian Health"
    assert body["website"] == "https://meridian.health"
    assert body["industry"] == "Healthcare"
    assert body | {"contacts_count": 0, "open_deals_count": 0, "open_value": 0} == body

    fetched = client.get(f"/api/organizations/{body['id']}").json()
    assert fetched["name"] == "Meridian Health"
    assert fetched["contacts"] == [] and fetched["deals"] == []


def test_ids_and_utc_timestamps(client, org):  # DATA-1
    body = org()
    assert isinstance(body["id"], int)
    created = datetime.fromisoformat(body["created_at"])
    assert created.utcoffset() == timedelta(0)
    assert body["created_at"] == body["updated_at"]


def test_update_changes_updated_at(client, org):  # DATA-1 API-2
    from accountable import clock

    body = org()
    clock.fix(date(2026, 11, 17), datetime(2026, 11, 17, 16, 0, tzinfo=UTC))
    response = client.put(f"/api/organizations/{body['id']}", json={"name": "Northwind Logistics"})
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == "Northwind Logistics"
    assert updated["updated_at"] > updated["created_at"]


def test_website_keeps_its_scheme(client, org):  # DATA-2
    assert org(website="http://example.org/about")["website"] == "http://example.org/about"
    assert org(website="")["website"] is None


def test_list_is_sorted_with_counts(client, org, contact, deal):  # API-2 DATA-1
    b = org(name="Bluepeak Retail")
    a = org(name="Atlas Freight")
    contact(organization_id=b["id"])
    deal(organization_id=b["id"], value=24_000)
    deal(organization_id=b["id"], value=50_000, stage="won")
    rows = client.get("/api/organizations").json()
    assert [r["name"] for r in rows] == ["Atlas Freight", "Bluepeak Retail"]
    assert rows[1]["contacts_count"] == 1
    assert rows[1]["open_deals_count"] == 1
    assert rows[1]["open_value"] == 24_000  # money as whole dollars
    assert rows[0]["id"] == a["id"]


def test_get_by_id_includes_contacts_and_deals(client, org, contact, deal):  # API-2
    o = org()
    contact(organization_id=o["id"], first_name="Grace", last_name="Liu")
    deal(organization_id=o["id"], name="Cloud migration")
    body = client.get(f"/api/organizations/{o['id']}").json()
    assert [c["name"] for c in body["contacts"]] == ["Grace Liu"]
    assert [d["name"] for d in body["deals"]] == ["Cloud migration"]
    assert "expected_revenue" in body["deals"][0]


def test_name_is_required(client):  # DATA-2 API-1
    response = client.post("/api/organizations", json={"name": "   "})
    assert response.status_code == 422
    assert response.json() == {"detail": "Enter a name"}


def test_missing_name_is_a_plain_message(client):  # API-1
    response = client.post("/api/organizations", json={})
    assert response.status_code == 422
    assert response.json() == {"detail": "Enter name"}


def test_long_name_is_refused(client):  # DATA-2 API-1
    response = client.post("/api/organizations", json={"name": "x" * 121})
    assert response.status_code == 422
    assert response.json()["detail"] == "Keep the name to 120 characters or fewer"
    assert client.post("/api/organizations", json={"name": "x" * 120}).status_code == 201


def test_bad_website_is_refused(client):  # DATA-2 API-1
    response = client.post("/api/organizations", json={"name": "A", "website": "not a website"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Enter a web address, such as northwind.com"


def test_notes_up_to_5000_characters(client):  # DATA-2
    assert client.post("/api/organizations", json={"name": "A", "notes": "n" * 5000}).status_code == 201
    response = client.post("/api/organizations", json={"name": "A", "notes": "n" * 5001})
    assert response.status_code == 422
    assert "5,000" in response.json()["detail"]


def test_unknown_organization_is_404_with_a_message(client):  # API-1
    response = client.get("/api/organizations/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "We couldn't find that organization"}
    assert client.put("/api/organizations/999", json={"name": "A"}).status_code == 404
    assert client.delete("/api/organizations/999").status_code == 404


def test_delete(client, org):  # API-2
    o = org()
    assert client.delete(f"/api/organizations/{o['id']}").status_code == 204
    assert client.get(f"/api/organizations/{o['id']}").status_code == 404
