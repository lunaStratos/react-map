
/**
 * 전체 액수 계산 
 * 모든 선택된 Grid를 넘기면 안의 price를 더한다. 
 */
export const allPrice = (data)=> {
    let price = 0;
    data.map(item => price += item.price);
    return price;
}




