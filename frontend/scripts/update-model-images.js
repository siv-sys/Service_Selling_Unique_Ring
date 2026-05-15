const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const imageUrls = [
    "https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900",
    "https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225",
    "https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938",
    "https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg",
    "https://jewelrybyjohan.com/cdn/shop/products/E3362WG10-2150BCArtCropped_1-5.jpg?v=1675110462&width=695",
    "https://img.kwcdn.com/product/open/2023-09-05/1693914328872-5ec4896063854249a6f2609cca8c9a22-goods.jpeg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
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
    "https://img.kwcdn.com/product/open/2023-09-05/1693903526024-a72036188e734902ac941154dd5c6b3e-goods.jpeg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    "https://i5.walmartimages.com/seo/Solid-10k-Yellow-Gold-His-Hers-Round-Diamond-Square-Matching-Couple-Three-Rings-Bridal-Engagement-Ring-Wedding-Bands-Set-1-12-Ct-L-9-M-10-5_e2bd050b-f2bd-451b-94ae-512679a5a087.9f8aa8cf42a34b3f048d1ea934507652.jpeg",
    "https://rukminim2.flixcart.com/image/480/640/k5vcya80/ring/j/e/a/adjustable-swn11nos1-ring-set-silvoswan-original-imafzgn9h6hpz9f4.jpeg?q=90"
];

async function updateModelImages() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ring_app'
    });

    try {
        // Get all ring models
        const [models] = await connection.execute('SELECT id, model_name FROM ring_models');
        
        console.log(`Found ${models.length} ring models`);
        
        // Update each model with an image
        for (let i = 0; i < models.length; i++) {
            const modelId = models[i].id;
            const modelName = models[i].model_name;
            const imageUrl = imageUrls[i % imageUrls.length];
            
            await connection.execute(
                'UPDATE ring_models SET image_url = ? WHERE id = ?',
                [imageUrl, modelId]
            );
            
            console.log(`✅ Updated model ${modelId}: ${modelName}`);
        }

        // Verify the updates
        const [updated] = await connection.execute(
            'SELECT id, model_name, image_url FROM ring_models WHERE image_url IS NOT NULL'
        );
        
        console.log(`\n🎉 Successfully updated ${updated.length} models with images!`);
        
    } catch (error) {
        console.error('❌ Error updating images:', error);
    } finally {
        await connection.end();
    }
}

updateModelImages();