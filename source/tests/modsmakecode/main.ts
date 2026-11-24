let player = sprites.create(img`.`, SpriteKind.Player)
let enemy = sprites.create(img`.`, SpriteKind.Enemy)
let inventory: string[] = []

mods.setCheckpoint(player, 80, 60)
mods.setHealth(player, 100, 100, 16)
mods.changeHealth(player, -10)
mods.addItem(inventory, "key")
mods.removeItem(inventory, "key")
mods.follow(enemy, player, 40)
mods.everyWave(3000, function () {
    sprites.create(img`.`, SpriteKind.Enemy)
})
