import { Popup } from "react-leaflet"
import React, { useState, useContext } from "react"
import ProductInfo from "../../models/ProductInfo"
import { IMapOrder } from "../../models/IMapOrder"
import { Button, message, Popconfirm, notification } from "antd"
import { OrderService } from "../../services/orderService"
import { LayerContext } from "../../context/LayerContext"
import cloneDeep from "lodash.clonedeep"
import { OrderCountdown } from "../OrderAlert/OrderCountdown"

interface OrderInfoPopupProps {
  order: IMapOrder;
  userId: string;
}

export const OrderInfoPopup: React.FC<OrderInfoPopupProps> = (props: OrderInfoPopupProps) => {
  const { allOrders, setAllOrders} = useContext(LayerContext)
  const [isInProgress, setIsInProgress] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);

  const acceptOrder = async() => {
    setIsInProgress(true);
    if (props.userId !== props.order.requestor.id) {
      const response = await OrderService.acceptOrder(props.order.order.id, props.userId);
      if (response.success) {
        let clonedOrders: IMapOrder[] = cloneDeep(allOrders);
        const orderIndex = clonedOrders.map(o => o.order.id).indexOf(props.order.order.id);
        let changedOrder = clonedOrders.filter(o => o.order.id === props.order.order.id)[0];
        changedOrder.order.inProgress = true;
        clonedOrders.splice(orderIndex, 1, changedOrder);
        setAllOrders(clonedOrders);
        notification.open({
          duration: 0,
          message: `Successfully accepted order for ${props.order.requestor.firstName} ${props.order.requestor.lastName}`,
          description: <>
            <OrderCountdown
              key="order-alert"
              isExecutor={true}
              order={props.order}
              deliveryMinutes={20}
              onCancelClick={() => message.info("Cancelinng.....")}
            />
          </>
        });

      } else {
        message.error({content: response.message, duration: 2});

      }
    }
  }
  const cancelOrder = async() => {
    setIsInProgress(false);
    setIsCanceling(true);
    message.info({content: "Canceling your order...", duration: 1})
    // TODO: Set active to false in db
    const response = await OrderService.cancelOrder(props.order.order.id);
    if (response.success) {
      let clonedOrders: IMapOrder[] = cloneDeep(allOrders);
        const orderIndex = clonedOrders.map(o => o.order.id).indexOf(props.order.order.id);
        let changedOrder = clonedOrders.filter(o => o.order.id === props.order.order.id)[0];
        changedOrder.order.inProgress = false;
        changedOrder.order.active = false;
        clonedOrders.splice(orderIndex, 1, changedOrder);
        setAllOrders(clonedOrders);
      message.success({content: "Successfully cancelled the delivery.", duration: 2});
      notification.close("order-alert")
    } else {
      message.error({content: response.message, duration: 2});
    }
    setIsCanceling(false);
  }

  const removeOrder = async() => {
    setIsInProgress(false);
    setIsCanceling(true);
    message.info({content: "Removing your order from the map. You can reactivate it from your profile.", duration: 1})
    // TODO: Set active to false in db
    const response = await OrderService.removeOrder(props.order.order.id);
    if (response.success) {
      let clonedOrders: IMapOrder[] = cloneDeep(allOrders);
      clonedOrders = clonedOrders.filter(o => o.order.id !== props.order.order.id);
      setAllOrders(clonedOrders);
      message.success({content: "Successfully removed the order.", duration: 2});
    } else {
      message.error({content: response.message, duration: 2});
    }
    setIsCanceling(false);
  }
  if (!props.userId) {
    return (
      <Popup>
        <div><span>You have to log in before viewing orders.</span></div>
      </Popup>
    )
  } else {
    return (
      <Popup>
        <div className="order-details">
          <div><span>Products wanted by {props.order.requestor.firstName} {props.order.requestor.lastName}</span></div>
          <ol>
          {(props.order.products || []).map((product: ProductInfo) => (
            <li>{product.name} - Qty: {product.quantity} - Price: {product.price}</li>
          ))}
          </ol>
          <div><span>Tip: {props.order.order.tip} ({props.order.order.tipPercentage * 100}%)</span></div>
          <div><span>Total price: {props.order.order.totalPrice}</span></div>
          <div className="button-section">
            {
              props.userId === props.order.requestor.id 
              ? null
              : <Button
               loading={isInProgress || props.order.order.inProgress}
               onClick={() => acceptOrder()}
               >
                 { isInProgress || props.order.order.inProgress ? "Order in progress" : "Accept order" }
               </Button>
            }
            {
              props.order.order.inProgress && props.userId === props.order.requestor.id
              ?
              <Popconfirm
                title="Do you want to continue searching for delivery person?"
                onConfirm={() => cancelOrder()}
                onCancel={() => removeOrder()}
                okText="Yes"
                cancelText="No"
              >
                <Button type="danger" loading={isCanceling}>Cancel delivery</Button>
              </Popconfirm>
              : null
            }
            {
              !props.order.order.inProgress && props.userId === props.order.requestor.id
              ? <Button type="danger" loading={isCanceling} onClick={() => removeOrder()}>Remove order</Button>
              : null
            }
          </div>
        </div>
      </Popup>
    )
  }
}