// Tọa độ quán của bạn (Hãy thay bằng tọa độ thật lấy từ Google Maps)
const SHOP_LAT = 10.835733;
const SHOP_LON = 106.779323;

export const getOSRMDistance = async (
  userLat: number,
  userLon: number,
): Promise<number> => {
  try {
    // OSRM dùng định dạng [Kinh độ, Vĩ độ]
    const url = `https://router.project-osrm.org/route/v1/driving/${SHOP_LON},${SHOP_LAT};${userLon},${userLat}?overview=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes.length > 0) {
      // Trả về số km (distance trả về mét nên chia cho 1000)
      return data.routes[0].distance / 1000;
    }
    return 0;
  } catch (error) {
    console.error("Lỗi OSRM:", error);
    return 0;
  }
};
