const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// 50 beautiful ring images
const ringImages = [
    "https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900",
    "https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225",
    "https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938",
    "https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg",
    "https://jewelrybyjohan.com/cdn/shop/products/E3362WG10-2150BCArtCropped_1-5.jpg?v=1675110462&width=695",
    "https://img.kwcdn.com/product/open/2023-09-05/1693914328872-5ec4896063854249a6f2609cca8c9a22-goods.jpeg",
    "https://i.pinimg.com/736x/0e/21/48/0e2148ac9639fa9f608f95c7584f4f98.jpg",
    "https://www.tajjewels.com/cdn/shop/products/19_FRONT_RoseGold_1080x.jpg?v=1650544247",
    "https://img.kwcdn.com/product/fancy/d42a9fc0-5d2e-4728-a4fc-7edb6afb62b7.jpg",
    "https://i.pinimg.com/originals/91/e0/eb/91e0ebb8563c8cd36337297331ab6a94.jpg",
    "https://cdn.augrav.com/online/jewels/2023/12/13110756/113.jpg",
    "https://m.media-amazon.com/images/I/51MTmuSy5eL._AC_UY1100_.jpg",
    "https://img.joomcdn.net/ce020665a289dab3b7fa1aa8e1482ec91f953958_original.jpeg",
    "https://i.etsystatic.com/16396575/r/il/51d9af/6115811213/il_570xN.6115811213_jfpd.jpg",
    "https://rukminim2.flixcart.com/image/480/640/xif0q/ring/1/b/j/adjustable-2-mkcr112-ring-myki-original-imagr5pjxbajyewj.jpeg?q=90",
    "https://i.pinimg.com/736x/1a/f3/6c/1af36c7a1c3e754334108a43a163b0ab.jpg",
    "https://i5.walmartimages.com/asr/cecf5302-3a84-45c2-95c7-ec5f4c212f4d.b8654ded71d4429be2d4d4febef4d2d6.jpeg?q=80",
    "https://sc04.alicdn.com/kf/H287107c64b9b4182b8477fd7ba79b7d21.jpg",
    "https://esdomera.com/cdn/shop/files/4F9A3506.jpg?v=1758004629&width=900",
    "https://cpimg.tistatic.com/08073806/b/4/Diamond-Couple-Rings.jpg",
    "https://m.media-amazon.com/images/I/61Jj1R1UChL._AC_UY1000_.jpg",
    "https://i.pinimg.com/474x/fd/61/84/fd61841efb1466054aab3424f076cb98.jpg",
    "https://laraso.com/cdn/shop/files/4811BL-3946_1000x1000.jpg?v=1757118068",
    "https://www.loville.co/cdn/shop/products/CPR5013FANTASY-1_600x600.jpg?v=1586341339",
    "https://m.media-amazon.com/images/I/81QzSKSsObS._AC_UY1000_.jpg",
    "https://t3.ftcdn.net/jpg/18/72/14/94/360_F_1872149462_JAK23sHoI6L4U5RrfFm25JQNUbFFC7QB.jpg",
    "https://img.kwcdn.com/product/open/2023-09-05/1693903526024-a72036188e734902ac941154dd5c6b3e-goods.jpeg",
    "https://i5.walmartimages.com/seo/Solid-10k-Yellow-Gold-His-Hers-Round-Diamond-Square-Matching-Couple-Three-Rings-Bridal-Engagement-Ring-Wedding-Bands-Set-1-12-Ct-L-9-M-10-5_e2bd050b-f2bd-451b-94ae-512679a5a087.9f8aa8cf42a34b3f048d1ea934507652.jpeg",
    "https://rukminim2.flixcart.com/image/480/640/k5vcya80/ring/j/e/a/adjustable-swn11nos1-ring-set-silvoswan-original-imafzgn9h6hpz9f4.jpeg?q=90",
    "https://springfieldjewellers.com.au/cdn/shop/articles/0Q7A9115-Edit-ready.jpg?v=1673850669",
    "https://media.tiffany.com/is/image/tco/2025_LE_QL_ChooseWeddingBand",
    "https://images-cdn.ubuy.qa/6544da4b4b2080775f561172-two-rings-his-hers-wedding-ring-sets.jpg",
    "https://ak1.ostkcdn.com/images/products/is/images/direct/7f162be8b39f733297ef76df51ffdd2c9515664d/Womens-3.25-CT-Princess-Cut-Wedding-Band-Engagement-Ring-Set-Silver.jpg",
    "https://i.pinimg.com/736x/eb/6a/72/eb6a722528b92ffdc943edbfa51b6ae1.jpg",
    "https://www.gemsmagic.com/cdn/shop/files/moss-agate-stag-inspired-couple-ring-set-nature-inspired-elven-rings-5905061_ee4ffdfc-383d-44b3-bb99-2f336a627cb3.webp?v=1767164444&width=2000",
    "https://cpimg.tistatic.com/7551683/b/4/real-diamond-couple-ring.jpg",
    "https://cdn-media.glamira.com/media/product/newgeneration/view/1/sku/pretty-raw-pair-v/womenstone/diamond-zirconia_AAAAA/alloycolour/yellow.jpg",
    "https://images.meesho.com/images/products/646386768/75km6_512.webp?width=512",
    "https://www.thelordofgemrings.com/cdn/shop/files/ruby-sapphire-diamond-railway-couple-birthstone-band-18k-gold-334656.jpg?v=1717646221",
    "https://cpimg.tistatic.com/8354229/b/1/modern-diamond-couple-band-ring.jpg",
    "https://www.ethanlord.com/cdn/shop/articles/Untitled_design_3.png?v=1763389639",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLfrMDiRQKW3vt2DEVVwnBmu838MgF9fmDYw&s",
    "https://images-aka.zales.com/plp/20250203_visnav/1%20Engagement%20PLP/FY26_0205_Z_NOPART_EngagementBridalSets_NoPromo_PLPTriggerBank_WEB_STATIC_GM_DSK_300x300.jpg",
    "https://i.pinimg.com/474x/22/72/e8/2272e85623fa218a6a541240041a9b42.jpg",
    "https://siyari.com/cdn/shop/files/SHOPIFYRESIZE-2025-10-03T130834.930.png?v=1760421993&width=1200",
    "https://m.media-amazon.com/images/I/61hC7x0SgdL._AC_UY1100_.jpg",
    "https://i.etsystatic.com/32012347/r/il/766d1d/5100701107/il_fullxfull.5100701107_lged.jpg",
    "https://png.pngtree.com/png-clipart/20240612/original/pngtree-illustration-of-luxury-couple-rings-png-image_15310403.png",
    "https://www.candere.com/media/jewellery/images/C025805G__6.jpeg",
    "https://cdn.augrav.com/online/jewels/2023/03/21163959/2-72.jpg"
];

// 50 unique ring names
const ringNames = [
    "Elysian Halo Diamond", "Midnight Sapphire Band", "Rose Gold Pavé",
    "Classic Platinum Solitaire", "Emerald Cut Eternity", "Celestial Opal Ring",
    "Vintage Marquise", "Art Deco Baguette", "Sunburst Citrine", "Infinity Twist",
    "Royal Ruby Halo", "Onyx Shield", "Morganite Blossom", "Titanium Chevron",
    "Pearl Embrace", "Spinel Star", "Amethyst Dusk", "Golden Eclipse",
    "Sapphire Trinity", "Diamond Petal", "Black Diamond Vault", "Jade Empress",
    "Ruby Cascade", "Peridot Breeze", "Garnet Flame", "Aquamarine Wave",
    "Moonstone Veil", "Lapis Code", "Tourmaline Vine", "Oval Solitaire",
    "Cushion Halo", "Princess Cut Legacy", "Asscher Eternity", "Radiant Crown",
    "Heart's Desire", "Baguette Trio", "Bezel Set Mercury", "Tension Set",
    "Twisted Vine", "Cat's Eye Chrysoberyl", "Alexandrite Charm", "Padparadscha",
    "Paraiba Tourmaline", "Tanzanite Night", "Zircon Spark", "Champagne Diamond",
    "Canary Yellow", "Salt and Pepper", "Rough Diamond Raw", "Eden Garden"
];

// Materials array
const materials = [
    "18K White Gold", "14K Yellow Gold", "950 Platinum", "18K Rose Gold", 
    "Sterling Silver", "14K White Gold", "18K Yellow Gold", "950 Platinum", 
    "18K Rose Gold", "14K Rose Gold", "Platinum", "White Gold", "Yellow Gold",
    "Rose Gold", "Titanium", "Palladium"
];

async function expandDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ring_app'
    });

    try {
        console.log('📦 Connected to database. Expanding to 50 rings...\n');

        // Check current count
        const [currentCount] = await connection.execute('SELECT COUNT(*) as count FROM rings');
        console.log(`Current rings: ${currentCount[0].count}`);

        // Calculate how many new rings to add
        const ringsToAdd = 50 - currentCount[0].count;
        console.log(`Need to add: ${ringsToAdd} rings\n`);

        if (ringsToAdd <= 0) {
            console.log('✅ Already have 50 or more rings!');
            return;
        }

        // Get existing model IDs
        const [models] = await connection.execute('SELECT id FROM ring_models');
        
        if (models.length === 0) {
            console.log('❌ No ring models found. Please add models first.');
            return;
        }

        // Add new rings
        let added = 0;
        for (let i = 0; i < ringsToAdd; i++) {
            const modelId = models[i % models.length].id;
            const material = materials[Math.floor(Math.random() * materials.length)];
            const size = ['5', '6', '7', '8', '9', '10'][Math.floor(Math.random() * 6)];
            const price = Math.floor(Math.random() * 8000) + 1000; // Random price between 1000-9000
            const identifier = `RING-${String(100 + i).padStart(3, '0')}`;
            const nameIndex = (currentCount[0].count + i) % ringNames.length;
            
            await connection.execute(`
                INSERT INTO rings (
                    ring_identifier, ring_name, model_id, size, material, 
                    price, status, location_type, location_label, image_url
                ) VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', 'WAREHOUSE', 'Main Warehouse', ?)
            `, [
                identifier,
                ringNames[nameIndex],
                modelId,
                size,
                material,
                price,
                ringImages[(currentCount[0].count + i) % ringImages.length]
            ]);
            
            added++;
            console.log(`   ✅ Added ring ${added}: ${ringNames[nameIndex]}`);
        }

        // Verify final count
        const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM rings');
        console.log(`\n✅ Total rings now: ${finalCount[0].count}`);

        // Show sample of new rings
        const [newRings] = await connection.execute(`
            SELECT id, ring_identifier, ring_name, material, price 
            FROM rings 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('\n📋 Latest 5 rings added:');
        newRings.forEach(ring => {
            console.log(`   - ${ring.ring_name} (${ring.ring_identifier}): $${ring.price}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

expandDatabase();