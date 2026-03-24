USE ring_app;

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NULL,
  model_name VARCHAR(120) NOT NULL,
  color VARCHAR(80) NULL,
  variant VARCHAR(160) NOT NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  serial_number VARCHAR(120) NOT NULL UNIQUE,
  status VARCHAR(40) NOT NULL DEFAULT 'In Stock', 
  stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
  stock_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status_color VARCHAR(20) NOT NULL DEFAULT 'emerald',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_inventory_model (model_name),
  KEY idx_inventory_color (color),
  KEY idx_inventory_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inventory_items
  (image_url, model_name, color, variant, sku, serial_number, status, stock_qty, stock_percent, status_color)
VALUES
  (
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCOV78VY4Fdm2XWC_ux_phNkkWau0YDvVV8qRMt4lub-GHKKAKGNgyXf1Q2_kTbXi2K1lF0z2_0WZscl8d4RRsUbpP1WALcV0fcE3DkfAWjMjTH0McaIGLBudP_5IjCI8oXke5GEhMk2JVE05MT3kyAzVf07doF6J3Y5hsV4PpEcVcb8Vlthw1lc5bM7t77Nu-GVldwo-clQjGOWt69Sm0LTebvMEQBqoaC1MKeLyw32ZFmfRqpaz34hipy_IGOOM1KynvSKlSTp8iY',
    'Gen 3 - Rose Gold',
    'Rose Gold',
    'Size 7 - Premium Alloy',
    'SKU-G3-RG-07',
    'SN: 8820-XL-421',
    'Low Stock',
    12,
    15,
    'amber'
  ),
  (
    'https://lh3.googleusercontent.com/aida-public/AB6AXuClU7KD3g2DAHs_y45M3ohuAYqp0BDE8ULQU56wCEAUXPigep9dSbsUMhQlpa_FKq5HRVy1oTPHLyZDmYYITQUawgwqc2IHCschz80w-ABhPYAOVaCQ_sYeZQ6I5Me0BXm_HI4536gPkpqJlSyrPTRZ-miV2tOYd4iD15e5djzVe-tcjUtd-uDpO3s9kXhlJjAvbF4GkWfsDoULNINM3GWboa4mnMee16Kh6XJ6HrpAwg8Qp9S08nKFpxtINwe-r5OTJevno4scRm9M',
    'Classic Silver',
    'Silver',
    'Size 9 - Polished Steel',
    'SKU-CLS-SV-09',
    'SN: 4492-CS-221',
    'In Stock',
    84,
    65,
    'emerald'
  ),
  (
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAtJbz4xoC06FWJPjntWC62FdOscgQpTGjCmWqmb2HiwN2tDHgOiTO6UOoiaMTeY2bOF2Koeg2W0Cg0d51UE4XuUyLXP19-1iFsobFBHJbcwmlBzH7RSeChY6dAKsAKEF0XBZhsq3s2T2rnKZFpVt5m0PHVV6kqt9Udbs_1ttQCYdytLuAep3VOx6-8Td2-UOTTlWadTPFm3xFttFHGW0Z9wpSwk7oDpnWLKt-x_Px40-BhpuqU4dtIKt-Uhh9s7y4bJwJ_Djgm6AQ_',
    'Midnight Black',
    'Black',
    'Size 12 - Carbon Fiber',
    'SKU-MID-BK-12',
    'SN: 7710-MB-003',
    'Depleted',
    0,
    0,
    'rose'
  )
ON DUPLICATE KEY UPDATE
  model_name = VALUES(model_name),
  color = VALUES(color),
  variant = VALUES(variant),
  status = VALUES(status),
  stock_qty = VALUES(stock_qty),
  stock_percent = VALUES(stock_percent),
  status_color = VALUES(status_color),
  image_url = VALUES(image_url);
