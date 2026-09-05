#!/usr/bin/env bash

SESSION="reservas"
MACHINE_ID=$(cat /etc/machine-id 2>/dev/null)

if [ "$MACHINE_ID" = "4e481538ea3d48369c467986c50121e5" ]; then
    BASE_DIR="$HOME/h/repos/f_resdep"
elif [ "$MACHINE_ID" = "6b7a2caba27e4fc78d77492859f3ec76" ]; then
    BASE_DIR="$HOME/h/pdu/reservas-deportivas"
else
    echo "Unknown machine-id: $MACHINE_ID. Using default directory."
    BASE_DIR="$HOME/h/pdu/reservas-deportivas"
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux attach-session -t "$SESSION"
    exit 0
fi

tmux new-session -d -s "$SESSION" -n "dev" \
    "cd $BASE_DIR/pwa && npm run dev -- --host=0.0.0.0 --port 4263"

tmux split-window -h -t "$SESSION:dev" \
    "cd $BASE_DIR/mock_api && source ~/_pve/rs-ma/bin/activate && python main.py"

tmux split-window -v -t "$SESSION:dev.1" \
    "cd $BASE_DIR/xk-mtg/ideas && python -m http.server 4262 --bind 0.0.0.0"

tmux select-layout -t "$SESSION:dev" tiled

tmux attach-session -t "$SESSION"
