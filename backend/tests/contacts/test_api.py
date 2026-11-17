"""Contact routes and field rules (DATA-3, API-3)."""


def test_create_starts_as_a_lead(client, org):  # DATA-3 API-3
    o = org()
    response = client.post(
        "/api/contacts",
        json={
            "first_name": "Grace",
            "last_name": "Liu",
            "email": "grace@meridian.health",
            "phone": "+1 555 0100",
            "job_title": "CIO",
            "organization_id": o["id"],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "lead"
    assert body["name"] == "Grace Liu"
    assert body["organization_name"] == "Northwind Labs"


def test_a_contact_without_an_organization_is_allowed(client, contact):  # DATA-3
    body = contact(first_name="Dana", last_name=None)
    assert body["organization_id"] is None
    assert body["organization_name"] is None
    assert body["name"] == "Dana"


def test_first_name_is_required(client):  # DATA-3
    response = client.post("/api/contacts", json={"first_name": " "})
    assert response.status_code == 422
    assert response.json()["detail"] == "Enter a first name"


def test_email_must_be_valid(client):  # DATA-3
    response = client.post("/api/contacts", json={"first_name": "Sam", "email": "sam-at-example"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Enter an email address, such as sam@northwind.com"
    assert client.post("/api/contacts", json={"first_name": "Sam", "email": ""}).status_code == 201


def test_status_must_be_known(client):  # DATA-3
    response = client.post("/api/contacts", json={"first_name": "Sam", "status": "vip"})
    assert response.status_code == 422


def test_unknown_organization_is_refused(client):  # DATA-3
    response = client.post("/api/contacts", json={"first_name": "Sam", "organization_id": 999})
    assert response.status_code == 422
    assert response.json()["detail"] == "That organization doesn't exist"


def test_status_filter(client, contact):  # API-3
    contact(first_name="A", status="lead")
    contact(first_name="B", status="customer")
    contact(first_name="C", status="customer")
    assert [c["first_name"] for c in client.get("/api/contacts?status=customer").json()] == ["B", "C"]
    assert len(client.get("/api/contacts").json()) == 3
    assert client.get("/api/contacts?status=nobody").status_code == 422


def test_update_and_get_with_deals(client, org, contact, deal):  # API-3
    o = org()
    c = contact(organization_id=o["id"])
    deal(organization_id=o["id"], contact_id=c["id"])
    response = client.put(f"/api/contacts/{c['id']}", json={"first_name": "Sam", "status": "customer"})
    assert response.status_code == 200
    assert response.json()["status"] == "customer"
    body = client.get(f"/api/contacts/{c['id']}").json()
    assert [d["name"] for d in body["deals"]] == ["Cloud migration"]


def test_unknown_contact_is_404(client):  # API-3
    assert client.get("/api/contacts/999").json() == {"detail": "We couldn't find that contact"}
