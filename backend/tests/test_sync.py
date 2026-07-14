import pytest
import time
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
