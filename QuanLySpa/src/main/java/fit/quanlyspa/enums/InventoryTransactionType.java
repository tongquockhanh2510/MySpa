package fit.quanlyspa.enums;

public enum InventoryTransactionType {
    STOCK_IN,    // Nhập kho
    STOCK_OUT,   // Xuất kho (bán hàng)
    ADJUSTMENT,  // Điều chỉnh tồn kho
    RETURN,      // Hàng trả lại
    DAMAGED,     // Hàng hỏng/thất thoát
    TRANSFER     // Chuyển kho
}
