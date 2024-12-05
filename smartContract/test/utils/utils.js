function generateRandomItemTypesArray(quantity) {
  const itemTypes = Array.from({ length: quantity }, () =>
    Math.floor(Math.random() * 3)
  );
  return itemTypes;
}

function generateRandomStatsArray(itemTypes) {
  const stats = itemTypes.map((itemType) => {
    let atk, def, speed;

    if (itemType === 0) {
      // Weapon
      atk = Math.floor(Math.random() * 100) + 1; // atk: 1~100
      def = 0; // def: 0
      speed = Math.floor(Math.random() * 11) * -1; // speed: 0~-10
    } else if (itemType === 1) {
      // Armour
      atk = 0; // atk: 0
      def = Math.floor(Math.random() * 100) + 1; // def: 1~100
      speed = Math.floor(Math.random() * 11) * -1; // speed: 0~-10
    } else if (itemType === 2) {
      // Boots
      atk = 0; // atk: 0
      def = Math.floor(Math.random() * 10) + 1; // def: 1~10
      speed = Math.floor(Math.random() * 51); // speed: 0~50
    }

    // durability: 20~100
    const durability = Math.floor(Math.random() * 80) + 20;

    return [atk, def, speed, durability];
  });

  return stats;
}

module.exports = { generateRandomItemTypesArray, generateRandomStatsArray };
