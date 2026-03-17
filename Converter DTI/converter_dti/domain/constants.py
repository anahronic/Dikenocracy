"""Deterministic domain constants for DKP-0-TIME-001 and client mapping."""

DTI_YEAR_DAYS = 360
DTI_DOY_MIN = 1
DTI_DOY_MAX = 360

T_NEAR = 0.05
T_LOW = 0.15
T_HIGH = 0.15

CS_THRESHOLD_BY_PROFILE = {
    "BASE": 0.15,
    "HARDENED": 0.25,
}

SIGNAL_COLOR = {
    "BELOW_MARKET": "#C9A227",
    "SLIGHTLY_BELOW": "#E6C65C",
    "NEAR_MARKET": "#2ECC71",
    "SLIGHTLY_ABOVE": "#F39C12",
    "ABOVE_MARKET": "#E74C3C",
    "NO_DATA": "#95A5A6",
}

OVERLAY_BY_INTEGRITY = {
    "NORMAL": None,
    "BURST_DETECTED": "warning_flag",
    "DOMAIN_DOMINANCE": "dominance_flag",
    "CLUSTER_COLLAPSE": "clustering_warning",
    "COLD_START": None,
}
