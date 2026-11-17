"""The fixed stage table (DATA-7) and GET /api/meta/stages (API-10)."""

from accountable.deals.stages import STAGES, stage


def test_stage_table():  # DATA-7
    assert [(s.key, s.label, s.probability, s.open) for s in STAGES] == [
        ("new", "New", 10, True),
        ("qualified", "Qualified", 25, True),
        ("proposal", "Proposal", 50, True),
        ("negotiation", "Negotiation", 75, True),
        ("won", "Won", 100, False),
        ("lost", "Lost", 0, False),
    ]


def test_stage_colors_follow_the_brand_order():  # DATA-7
    assert [(s.color, s.text_color) for s in STAGES] == [
        ("#06D6A0", "#073B4C"),  # Sea Green
        ("#FFC145", "#073B4C"),  # Marigold
        ("#F78C6B", "#073B4C"),  # Coral
        ("#118AB2", "#FFFFFF"),  # Cerulean, white text
        ("#073B4C", "#FFFFFF"),  # Midnight, white text
        ("#CDD8DB", "#073B4C"),  # Sea Mist
    ]


def test_stage_lookup():  # DATA-7
    assert stage("proposal").label == "Proposal"


def test_meta_stages_route(client):  # API-10
    response = client.get("/api/meta/stages")
    assert response.status_code == 200
    body = response.json()
    assert [s["key"] for s in body] == ["new", "qualified", "proposal", "negotiation", "won", "lost"]
    assert body[3] == {
        "key": "negotiation",
        "label": "Negotiation",
        "probability": 75,
        "open": True,
        "color": "#118AB2",
        "text_color": "#FFFFFF",
    }
