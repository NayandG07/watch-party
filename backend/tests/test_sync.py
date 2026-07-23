import pytest
import time
from app.api.rooms import _resolve_playback_command
from app.services.room_manager import RoomState_Live
from app.models.enums import RoomState
from datetime import datetime, timezone

def test_room_state_math_playing():
    """Test position extrapolation when playing."""
    state = RoomState_Live(
        room_id="room1",
        state=RoomState.PLAYING,
        host_id="host1",
        position_seconds=10.0,
        speed=1.0,
        updated_at=datetime.fromtimestamp(time.time() - 2.0, tz=timezone.utc)
    )
    
    current_pos = state.current_position()
    
    # Should be roughly 10 + 2 = 12 seconds
    assert 11.9 <= current_pos <= 12.1

def test_room_state_math_paused():
    """Test position calculation when paused."""
    state = RoomState_Live(
        room_id="room1",
        state=RoomState.PAUSED,
        host_id="host1",
        position_seconds=10.0,
        speed=1.0,
        updated_at=datetime.fromtimestamp(time.time() - 5.0, tz=timezone.utc)
    )
    
    current_pos = state.current_position()
    
    # Should be exactly 10
    assert current_pos == 10.0

def test_room_state_playback_rate():
    """Test position extrapolation with 2x speed."""
    state = RoomState_Live(
        room_id="room1",
        state=RoomState.PLAYING,
        host_id="host1",
        position_seconds=10.0,
        speed=2.0,
        updated_at=datetime.fromtimestamp(time.time() - 2.0, tz=timezone.utc)
    )
    
    current_pos = state.current_position()
    
    # Should be roughly 10 + (2 * 2) = 14 seconds
    assert 13.9 <= current_pos <= 14.1


def test_ended_command_freezes_room_timeline():
    """The server should stop extrapolating once the video ends."""
    live = RoomState_Live(
        room_id="room1",
        state=RoomState.PLAYING,
        host_id="host1",
        position_seconds=26.0,
        speed=1.0,
    )

    new_state, position = _resolve_playback_command(
        msg_type="ENDED",
        position=27.0,
        live=live,
        media_duration_seconds=27.0,
    )

    assert new_state == RoomState.ENDED
    assert position == 27.0


def test_premature_ended_report_does_not_stop_room_timeline():
    """A drifting client should not end the room before the room timeline reaches the end."""
    live = RoomState_Live(
        room_id="room1",
        state=RoomState.PLAYING,
        host_id="host1",
        position_seconds=10.0,
        speed=1.0,
    )

    new_state, position = _resolve_playback_command(
        msg_type="ENDED",
        position=27.0,
        live=live,
        media_duration_seconds=27.0,
        authoritative_position=10.0,
    )

    assert new_state == RoomState.PLAYING
    assert position == 10.0


def test_replay_from_ended_room_starts_at_zero():
    """Pressing play after a completed video should replay from the beginning."""
    live = RoomState_Live(
        room_id="room1",
        state=RoomState.ENDED,
        host_id="host1",
        position_seconds=27.0,
        speed=1.0,
    )

    new_state, position = _resolve_playback_command(
        msg_type="PLAY",
        position=27.0,
        live=live,
        media_duration_seconds=27.0,
    )

    assert new_state == RoomState.PLAYING
    assert position == 0.0


def test_play_from_known_media_end_starts_at_zero_even_without_ended_state():
    """Repair stale rooms that were left playing past the media duration."""
    live = RoomState_Live(
        room_id="room1",
        state=RoomState.PLAYING,
        host_id="host1",
        position_seconds=27.0,
        speed=1.0,
    )

    new_state, position = _resolve_playback_command(
        msg_type="PLAY",
        position=27.0,
        live=live,
        media_duration_seconds=27.0,
    )

    assert new_state == RoomState.PLAYING
    assert position == 0.0
