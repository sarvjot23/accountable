"""Deal and pipeline rules, with a fixed "today" (RULE-1 to RULE-6, RULE-14, PIPE-15)."""

import random
from datetime import UTC, date, datetime

import pytest

from accountable.deals import rules

TODAY = date(2026, 11, 17)
NOW = datetime(2026, 11, 17, 15, 30, tzinfo=UTC)


def deal(**fields):
    base = {
        "stage": "proposal",
        "value": 10_000,
        "probability": 50,
        "probability_manual": False,
        "close_date": date(2026, 12, 1),
        "close_date_manual": False,
    }
    return base | fields


# RULE-1 expected revenue


def test_expected_revenue_is_value_times_probability():  # RULE-1
    assert rules.expected_revenue(24_000, 10) == 2_400
    assert rules.expected_revenue(0, 75) == 0
    assert rules.expected_revenue(150_000, 100) == 150_000


def test_expected_revenue_rounds_to_the_dollar():  # RULE-1
    assert rules.expected_revenue(1_005, 50) == 503  # 502.5 rounds half up
    assert rules.expected_revenue(1_003, 25) == 251  # 250.75
    assert rules.expected_revenue(999, 33) == 330  # 329.67


# RULE-2 open totals


def test_open_totals_count_only_open_stages():  # RULE-2
    deals = [
        deal(stage="new", value=24_000, probability=10),
        deal(stage="negotiation", value=150_000, probability=75),
        deal(stage="won", value=92_000, probability=100),
        deal(stage="lost", value=75_000, probability=0),
    ]
    assert rules.open_totals(deals) == {"count": 2, "value": 174_000, "expected_revenue": 2_400 + 112_500}


def test_open_totals_of_nothing_are_zero():  # RULE-2
    assert rules.open_totals([]) == {"count": 0, "value": 0, "expected_revenue": 0}


# RULE-3 stage change


def test_stage_change_sets_probability_and_clears_manual():  # RULE-3
    changes = rules.stage_change(deal(probability=90, probability_manual=True), "negotiation", TODAY, NOW)
    assert changes["stage"] == "negotiation"
    assert changes["probability"] == 75
    assert changes["probability_manual"] is False
    assert changes["stage_changed_at"] == NOW
    assert "close_date" not in changes  # open stage: the expected close date stays


def test_stage_change_to_won_sets_close_date_to_today():  # RULE-3
    changes = rules.stage_change(deal(), "won", TODAY, NOW)
    assert changes["probability"] == 100
    assert changes["close_date"] == TODAY


def test_stage_change_to_lost_sets_close_date_to_today():  # RULE-3
    changes = rules.stage_change(deal(close_date=None), "lost", TODAY, NOW)
    assert changes["probability"] == 0
    assert changes["close_date"] == TODAY


def test_stage_change_keeps_a_manual_close_date():  # RULE-3 RULE-5
    changes = rules.stage_change(deal(close_date=date(2026, 11, 2), close_date_manual=True), "won", TODAY, NOW)
    assert "close_date" not in changes


def test_same_stage_is_no_change():  # RULE-3
    assert rules.stage_change(deal(stage="proposal"), "proposal", TODAY, NOW) == {}


def test_stage_change_description():  # RULE-3
    assert rules.stage_change_description("proposal", "negotiation") == "Moved from Proposal to Negotiation"
    assert rules.stage_change_description("won", "qualified") == "Moved from Won to Qualified"


def test_unknown_stage_is_refused():  # RULE-3
    with pytest.raises(ValueError):
        rules.stage_change(deal(), "pending", TODAY, NOW)


# RULE-4 back from closed


def test_back_from_won_takes_the_stage_probability_and_keeps_the_close_date():  # RULE-4
    won = deal(stage="won", probability=100, close_date=date(2026, 11, 3))
    changes = rules.stage_change(won, "negotiation", TODAY, NOW)
    assert changes["probability"] == 75
    assert "close_date" not in changes


def test_back_from_lost_to_new():  # RULE-4
    lost = deal(stage="lost", probability=0, close_date=date(2026, 9, 3))
    changes = rules.stage_change(lost, "new", TODAY, NOW)
    assert changes["stage"] == "new"
    assert changes["probability"] == 10
    assert "close_date" not in changes


# RULE-5 manual values through the deal form


def test_editing_probability_marks_it_manual():  # RULE-5
    changes, moved = rules.edit_deal(deal(), {"probability": 65}, TODAY, NOW)
    assert not moved
    assert changes["probability"] == 65
    assert changes["probability_manual"] is True


def test_unchanged_probability_stays_automatic():  # RULE-5
    changes, _ = rules.edit_deal(deal(), {"probability": 50, "value": 12_000}, TODAY, NOW)
    assert changes.get("probability_manual", False) is False


def test_editing_close_date_marks_it_manual():  # RULE-5
    changes, _ = rules.edit_deal(deal(), {"close_date": date(2027, 1, 15)}, TODAY, NOW)
    assert changes["close_date"] == date(2027, 1, 15)
    assert changes["close_date_manual"] is True


def test_manual_probability_is_kept_until_the_stage_changes():  # RULE-5
    current = deal(probability=65, probability_manual=True)
    kept, _ = rules.edit_deal(current, {"value": 11_000, "probability": 65}, TODAY, NOW)
    assert "probability" not in kept or kept["probability"] == 65
    moved, did_move = rules.edit_deal(current, {"stage": "negotiation", "probability": 65}, TODAY, NOW)
    assert did_move
    assert moved["probability"] == 75
    assert moved["probability_manual"] is False


def test_form_stage_change_follows_the_same_rule_as_dragging():  # RULE-3 RULE-5
    changes, did_move = rules.edit_deal(deal(), {"stage": "won", "probability": 50}, TODAY, NOW)
    assert did_move
    assert changes == rules.stage_change(deal(), "won", TODAY, NOW)


def test_manual_close_date_is_kept_through_a_stage_change():  # RULE-5
    changes, _ = rules.edit_deal(deal(), {"stage": "won", "close_date": date(2026, 11, 10)}, TODAY, NOW)
    assert changes["close_date"] == date(2026, 11, 10)
    assert changes["close_date_manual"] is True


def test_close_date_given_when_adding_is_manual_like_an_edit():  # RULE-5
    added = rules.new_deal("proposal", None, date(2027, 1, 15), TODAY)
    assert added["close_date"] == date(2027, 1, 15) and added["close_date_manual"] is True
    without = rules.new_deal("proposal", None, None, TODAY)
    assert without["close_date"] is None and without["close_date_manual"] is False
    straight_to_won = rules.new_deal("won", None, None, TODAY)
    assert straight_to_won["close_date"] == TODAY and straight_to_won["close_date_manual"] is False


def test_probability_set_with_a_stage_change_is_manual():  # RULE-5
    changes, _ = rules.edit_deal(deal(), {"stage": "negotiation", "probability": 80}, TODAY, NOW)
    assert changes["probability"] == 80
    assert changes["probability_manual"] is True


# RULE-6 late


@pytest.mark.parametrize(
    ("stage", "close_date", "late"),
    [
        ("proposal", date(2026, 11, 16), True),
        ("new", date(2026, 1, 1), True),
        ("proposal", TODAY, False),  # due today is not late yet
        ("proposal", date(2026, 11, 18), False),
        ("negotiation", None, False),  # no date, never late
        ("won", date(2026, 1, 1), False),
        ("lost", date(2026, 1, 1), False),
    ],
)
def test_late(stage, close_date, late):  # RULE-6
    assert rules.is_late(stage, close_date, TODAY) is late


# PIPE-15 positions


def test_drop_between_two_cards_takes_the_midpoint():  # PIPE-15
    column = [(1, 1.0), (2, 2.0), (3, 3.0)]
    assert rules.drop_position(column, before_id=1, after_id=2) == (1.5, {})


def test_drop_at_the_top_and_the_bottom():  # PIPE-15
    column = [(1, 1.0), (2, 2.0)]
    assert rules.drop_position(column, before_id=None, after_id=1) == (0.0, {})
    assert rules.drop_position(column, before_id=2, after_id=None) == (3.0, {})


def test_drop_into_an_empty_column():  # PIPE-15
    assert rules.drop_position([], before_id=None, after_id=None) == (1.0, {})


def test_drop_with_only_one_neighbour_named_uses_the_column_order():  # PIPE-15
    column = [(1, 1.0), (2, 2.0), (3, 3.0)]
    assert rules.drop_position(column, before_id=2, after_id=None) == (2.5, {})
    assert rules.drop_position(column, before_id=None, after_id=2) == (1.5, {})


def test_unknown_neighbour_is_refused():  # PIPE-15
    with pytest.raises(ValueError):
        rules.drop_position([(1, 1.0)], before_id=9, after_id=None)


def test_positions_too_close_renumber_the_column():  # PIPE-15
    column = [(1, 1.0), (2, 1.0 + 1e-9), (3, 2.0)]
    position, renumbered = rules.drop_position(column, before_id=1, after_id=2)
    assert renumbered == {1: 1.0, 2: 3.0, 3: 4.0}
    assert position == 2.0


def test_end_position():  # PIPE-15
    assert rules.end_position([]) == 1.0
    assert rules.end_position([4.0, 1.5]) == 5.0


def test_200_random_moves_keep_a_strict_order():  # PIPE-15
    rng = random.Random(7)
    cards = {i: float(i) for i in range(1, 9)}  # id -> position, one column
    expected = sorted(cards, key=lambda c: cards[c])
    for _ in range(200):
        moving = rng.choice(expected)
        rest = [c for c in expected if c != moving]
        index = rng.randint(0, len(rest))
        # Often drop into the same gap, to force tiny gaps and renumbering.
        if rng.random() < 0.5:
            index = 1
        before = rest[index - 1] if index > 0 else None
        after = rest[index] if index < len(rest) else None
        column = [(c, cards[c]) for c in rest]
        position, renumbered = rules.drop_position(column, before, after)
        cards.update(renumbered)
        cards[moving] = position
        expected = rest[:index] + [moving] + rest[index:]
        actual = sorted(cards, key=lambda c: cards[c])
        assert actual == expected
        positions = [cards[c] for c in actual]
        assert all(a < b for a, b in zip(positions, positions[1:], strict=False))


# RULE-14 funnel


def funnel_deal(id_, stage, value, close_date=None):
    return {"id": id_, "stage": stage, "value": value, "close_date": close_date}


def by_stage(result):
    return {s["stage"]: (s["value"], s["count"]) for s in result["stages"]}


def test_a_won_deal_counts_at_every_stage():  # RULE-14
    deals = [funnel_deal(1, "won", 100, date(2026, 10, 1))]
    history = {1: ["new", "qualified", "proposal", "negotiation", "won"]}
    result = rules.funnel(deals, history, TODAY)
    assert by_stage(result) == {s: (100, 1) for s in ["new", "qualified", "proposal", "negotiation", "won"]}
    assert result["new_to_won_share"] == 100


def test_a_deal_lost_at_proposal_counts_up_to_proposal():  # RULE-14
    deals = [funnel_deal(1, "lost", 100, date(2026, 10, 1))]
    history = {1: ["new", "qualified", "proposal", "lost"]}
    assert by_stage(rules.funnel(deals, history, TODAY)) == {
        "new": (100, 1),
        "qualified": (100, 1),
        "proposal": (100, 1),
        "negotiation": (0, 0),
        "won": (0, 0),
    }


def test_a_deal_created_at_proposal_counts_as_having_passed_new_and_qualified():  # RULE-14
    deals = [funnel_deal(1, "proposal", 80)]
    result = rules.funnel(deals, {1: ["proposal"]}, TODAY)
    assert by_stage(result)["new"] == (80, 1)
    assert by_stage(result)["qualified"] == (80, 1)
    assert by_stage(result)["proposal"] == (80, 1)
    assert by_stage(result)["negotiation"] == (0, 0)


def test_deleted_history_never_puts_a_deal_below_its_current_stage():  # RULE-14
    deals = [funnel_deal(1, "negotiation", 50), funnel_deal(2, "won", 30, date(2026, 11, 2))]
    result = rules.funnel(deals, {}, TODAY)
    assert by_stage(result)["negotiation"] == (80, 2)
    assert by_stage(result)["won"] == (30, 1)


def test_a_deal_moved_back_still_counts_at_the_furthest_stage():  # RULE-14
    deals = [funnel_deal(1, "qualified", 40)]
    history = {1: ["new", "qualified", "proposal", "negotiation", "qualified"]}
    assert by_stage(rules.funnel(deals, history, TODAY))["negotiation"] == (40, 1)


def test_closed_deals_older_than_12_months_are_left_out():  # RULE-14
    deals = [
        funnel_deal(1, "won", 100, date(2025, 11, 30)),  # before the 12-month window
        funnel_deal(2, "won", 60, date(2025, 12, 1)),  # first day of the window
        funnel_deal(3, "new", 40),
    ]
    result = rules.funnel(deals, {}, TODAY)
    assert by_stage(result)["new"] == (100, 2)
    assert by_stage(result)["won"] == (60, 1)


def test_funnel_shares_are_of_the_value_at_new():  # RULE-14
    deals = [
        funnel_deal(1, "won", 60, date(2026, 11, 1)),
        funnel_deal(2, "proposal", 40),
    ]
    result = rules.funnel(deals, {}, TODAY)
    shares = {s["stage"]: s["share"] for s in result["stages"]}
    assert shares == {"new": 100, "qualified": 100, "proposal": 100, "negotiation": 60, "won": 60}
    assert result["new_to_won_share"] == 60
    assert result["won_count"] == 1
    assert result["new_count"] == 2


def test_empty_funnel():  # RULE-14
    result = rules.funnel([], {}, TODAY)
    assert all(s["value"] == 0 and s["share"] == 0 for s in result["stages"])
    assert result["new_to_won_share"] == 0


# Month helpers used by RULE-13 and the funnel window


def test_month_helpers():
    assert rules.add_months(date(2026, 1, 1), -1) == date(2025, 12, 1)
    assert rules.add_months(date(2026, 11, 1), -11) == date(2025, 12, 1)
    assert rules.month_start(date(2026, 11, 17)) == date(2026, 11, 1)


# New deals (RULE-1, RULE-5)


def test_a_new_deal_takes_its_stage_probability():  # RULE-5
    assert rules.new_deal("qualified", None, None, TODAY) == {
        "probability": 25,
        "probability_manual": False,
        "close_date": None,
        "close_date_manual": False,
    }


def test_a_new_deal_with_its_own_probability_is_manual():  # RULE-5
    assert rules.new_deal("qualified", 40, date(2027, 1, 1), TODAY)["probability_manual"] is True
    assert rules.new_deal("qualified", 25, None, TODAY)["probability_manual"] is False


def test_a_deal_added_straight_into_won_closes_today():  # RULE-3
    assert rules.new_deal("won", None, None, TODAY)["close_date"] == TODAY
    assert rules.new_deal("won", None, date(2026, 11, 2), TODAY)["close_date"] == date(2026, 11, 2)
