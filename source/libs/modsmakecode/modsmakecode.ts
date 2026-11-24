//% blockNamespace=mods color="#8E44AD" weight=20
namespace mods {
    let healthValues: number[] = [];
    let healthMaximums: number[] = [];
    let healthSprites: Sprite[] = [];
    let healthWidths: number[] = [];

    /**
     * Store a checkpoint position for a sprite.
     * @param sprite the sprite to remember
     * @param x horizontal checkpoint position in pixels
     * @param y vertical checkpoint position in pixels
     */
    //% blockId=modssetcheckpoint
    //% block="Mods: set checkpoint for %sprite=variables_get(mySprite) at x %x y %y"
    //% x.shadow="positionPicker" y.shadow="positionPicker"
    //% x.defl=80 y.defl=60
    //% group="Checkpoints"
    //% weight=100
    //% help=mods/checkpoints
    export function setCheckpoint(sprite: Sprite, x: number, y: number): void {
        sprite.data["modsCheckpointX"] = x;
        sprite.data["modsCheckpointY"] = y;
    }

    /**
     * Move a sprite back to its most recently saved checkpoint.
     * @param sprite the sprite to respawn
     */
    //% blockId=modsrespawn
    //% block="Mods: respawn %sprite=variables_get(mySprite)"
    //% group="Checkpoints"
    //% weight=90
    //% help=mods/checkpoints
    export function respawn(sprite: Sprite): void {
        const x = sprite.data["modsCheckpointX"];
        const y = sprite.data["modsCheckpointY"];
        if (typeof x === "number" && typeof y === "number") {
            sprite.setPosition(x, y);
        }
    }

    /**
     * Display a health bar above a sprite.
     * @param sprite the sprite to track
     * @param health current health
     * @param maximum maximum health
     * @param width bar width in pixels
     */
    //% blockId=modssethealth
    //% block="Mods: set health bar for %sprite=variables_get(mySprite) to %health / %maximum width %width"
    //% health.defl=100 maximum.defl=100 width.defl=16
    //% group="Health"
    //% weight=100
    //% help=mods/health
    export function setHealth(sprite: Sprite, health: number, maximum: number, width: number): void {
        let index = healthSprites.indexOf(sprite);
        if (index < 0) {
            index = healthSprites.length;
            healthSprites.push(sprite);
        }
        healthValues[index] = Math.max(0, health);
        healthMaximums[index] = Math.max(1, maximum);
        healthWidths[index] = Math.max(2, width);
    }

    /**
     * Change a sprite's health and return its new value.
     * @param sprite the sprite to update
     * @param amount positive or negative health change
     */
    //% blockId=modschangehealth
    //% block="Mods: change health for %sprite=variables_get(mySprite) by %amount"
    //% amount.defl=-1
    //% group="Health"
    //% weight=90
    //% help=mods/health
    export function changeHealth(sprite: Sprite, amount: number): number {
        let index = healthSprites.indexOf(sprite);
        if (index < 0) return 0;
        healthValues[index] = Math.max(0, Math.min(healthMaximums[index], healthValues[index] + amount));
        return healthValues[index];
    }

    /**
     * Start a repeating enemy wave callback.
     * @param periodMilliseconds delay between waves in milliseconds
     * @param createWave code that creates the wave
     */
    //% blockId=modswave
    //% block="Mods: every %periodMilliseconds ms run wave"
    //% periodMilliseconds.defl=3000
    //% periodMilliseconds.shadow=timePicker
    //% group="Enemy waves"
    //% weight=100
    //% help=mods/waves
    //% handlerStatement=1
    export function everyWave(periodMilliseconds: number, createWave: () => void): void {
        game.onUpdateInterval(periodMilliseconds, createWave);
    }

    /**
     * Add an item to an inventory array.
     * @param inventory the inventory array
     * @param item item name
     */
    //% blockId=modsadditem
    //% block="Mods: add %item to inventory %inventory=variables_get(inventory)"
    //% item.defl="key"
    //% group="Inventory"
    //% weight=100
    //% help=mods/inventory
    export function addItem(inventory: string[], item: string): void {
        inventory.push(item);
    }

    /**
     * Remove one matching item from an inventory array.
     * @param inventory the inventory array
     * @param item item name
     */
    //% blockId=modsremoveitem
    //% block="Mods: remove %item from inventory %inventory=variables_get(inventory)"
    //% item.defl="key"
    //% group="Inventory"
    //% weight=90
    //% help=mods/inventory
    export function removeItem(inventory: string[], item: string): boolean {
        const index = inventory.indexOf(item);
        if (index < 0) return false;
        inventory.removeAt(index);
        return true;
    }

    /**
     * Ask the player to choose between two dialogue labels.
     * @param prompt text shown above the choices
     * @param firstLabel label for the first choice
     * @param secondLabel label for the second choice
     */
    //% blockId=modsaskchoice
    //% block="Mods: ask %prompt and choices %firstLabel or %secondLabel"
    //% prompt.defl="Which path?" firstLabel.defl="Left" secondLabel.defl="Right"
    //% group="Dialogue"
    //% weight=100
    //% help=mods/dialogue
    export function askChoice(prompt: string, firstLabel: string, secondLabel: string): boolean {
        return game.askForString(`${prompt} (${firstLabel}/${secondLabel})`, 24) == firstLabel;
    }

    /**
     * Make a sprite follow another sprite with a steady speed.
     * @param mover sprite that moves
     * @param target sprite to follow
     * @param speed pixels per second
     */
    //% blockId=modsfollow
    //% block="Mods: make %mover=variables_get(mySprite) follow %target=variables_get(mySprite) at %speed px/s"
    //% speed.defl=50
    //% speed.shadow=spriteSpeedPicker
    //% group="Movement"
    //% weight=100
    //% help=mods/movement
    export function follow(mover: Sprite, target: Sprite, speed: number): void {
        game.onUpdate(function () {
            const dx = target.x - mover.x;
            const dy = target.y - mover.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 1) {
                mover.setVelocity(dx / length * speed, dy / length * speed);
            } else {
                mover.setVelocity(0, 0);
            }
        });
    }

    game.onUpdate(function () {
        for (let i = 0; i < healthSprites.length; i++) {
            const sprite = healthSprites[i];
            if (!sprite) continue;
            const health = healthValues[i];
            const maximum = healthMaximums[i];
            const width = healthWidths[i];
            const x = Math.floor(sprite.x - width / 2);
            const y = Math.floor(sprite.y - sprite.height / 2 - 5);
            screen.fillRect(x, y, width, 3, 15);
            const filled = Math.floor(width * health / maximum);
            if (filled > 0) screen.fillRect(x, y, filled, 3, 7);
        }
    });
}
