import React, { Component } from 'react'
import { Grid, GridCell } from '@rmwc/grid';
import { TabBar, Tab } from '@rmwc/tabs';
import { Chip, ChipSet } from '@rmwc/chip';
import {
  List,
  ListItem,
  ListItemText,
  ListItemGraphic
} from '@rmwc/list';
import { TextField } from '@rmwc/textfield';
import { Button } from '@rmwc/button';
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import { LinearProgress } from '@rmwc/linear-progress';

import './Details.css'

const AddOrder = gql`
  mutation addOrder($name: String, $table: Int!, $notes: String, $dishes: [orderDishMutation]!){
    addOrder(table: $table, name: $name, dishes: $dishes, notes: $notes){
      _id, 
      name,
      table,
      notes
    }
  }
`;

const UpdateOrder = gql`
  mutation updateOrder($id: ID!, $name: String, $table: Int, $notes: String, $dishes: [orderDishMutation]){
    updateOrder(_id: $id, table: $table, name: $name, dishes: $dishes, notes: $notes ){
      _id, 
      name,
      table,
      notes
    }
  }
`;

export default class DetailContent extends Component {
  constructor(){
    super()

    this.addDish = this.addDish.bind(this)
    this.removeDish = this.removeDish.bind(this)
    this.changeTextField = this.changeTextField.bind(this)
  }


  state = {
    id: "",
    name: "",
    table: 0, 
    notes : "",
    dishes: [],
    activeTabIndex: 0,
    dishTypes: {}
  } 

  componentDidMount(){
    if (this.props.order)
      this.setState({
        id: this.props.order._id,
        name: this.props.order.name,
        table: this.props.order.table,
        notes: this.props.order.notes,
        dishes: this.props.order.dishes.map(d => {return {dish: {id: d.dish._id, name: d.dish.name }, made: d.made, hasPayed: d.hasPayed}})
      })
      
    const dishTypes = this.state.dishTypes
     this.props.dishes.forEach(d => {
      if (dishTypes[d.type.name]){
        dishTypes[d.type.name].push(d)
      } else {
        dishTypes[d.type.name] = [d]
      }
    });

    this.setState({
      dishTypes: dishTypes
    })
  }

  addDish(id, name){
    return () => {
      const dishes = [{ dish: { id, name }, made: false, hasPayed: false }].concat(this.state.dishes)
      this.setState(
        {
          dishes: dishes
        })
    }
  }

  removeDish(id){
    return () => {
      let dishes = this.state.dishes
      if (dishes.length === 1)
        dishes = []
      else 
        dishes.splice(id, 1)
      this.setState({ dishes: dishes})
    }
  }

  changeTextField(field){
    return (e) =>{
      const state = {}
      state[field] = e.target.value
      this.setState(state)
    }
  }

  render() {
    const keys = Object.keys(this.state.dishTypes)
    return (
      <React.Fragment>
      <Grid className="order-details">
        <GridCell span="12">
          { keys.length === 0 ? String() : 
              <TabBar
                activeTabIndex={this.state.activeTabIndex}
                onActivate={evt => {
                  this.setState({ 'activeTabIndex': evt.detail.index })
                }}
              >
                {keys.map((v, i) => <Tab key={i}>{v}</Tab>)}
              </TabBar>
          }
            <ChipSet>
              {(this.state.dishTypes[keys[this.state.activeTabIndex]] || []).map((v, i) =>
                <Chip key={i} onClick={this.addDish(v._id, v.name)} text={v.name}/>
              )}
            </ChipSet>  

        </GridCell>
      </Grid>
      <Grid className="order-details">
        <GridCell span="6">
          <List>
              {this.state.dishes.map((v, i) => {
                if (v.hasPayed || v.made)
                  return (<ListItem key={i} ripple={false}>
                    <ListItemGraphic icon={v.hasPayed ? "attach_money" : "done"} />
                    <ListItemText>{v.dish.name}</ListItemText>
                  </ListItem>)
                return (
                <ListItem key={i} onClick={this.removeDish(i)}>
                  <ListItemGraphic icon="remove" />
                  <ListItemText>{v.dish.name}</ListItemText>
                </ListItem>)
              }
              )}
          </List>
        </GridCell>
        <GridCell span="6">
            <TextField withLeadingIcon="event_seat" label="Table" type="number" min="0" inputMode="numeric" pattern="\d*" value={this.state.table} onChange={this.changeTextField("table")} />
            <TextField withLeadingIcon="account_circle" label="Name" value={this.state.name} onChange={this.changeTextField("name")} />
            <TextField textarea fullwidth label="Notes" type="number" value={this.state.notes} onChange={this.changeTextField("notes")} />
        </GridCell>
      </Grid>
      <Mutation mutation={this.props.id ? UpdateOrder : AddOrder}>
      {(addOrUpdate, {data, loading, error}) => {
          let result = <Button onClick={() => addOrUpdate({
            variables: {
              id: this.state.id,
              table: parseInt(this.state.table),
              name: this.state.name,
              notes: this.state.notes,
              dishes: this.state.dishes.map(d => { return { id: d.dish.id, made: d.made, hasPayed: d.hasPayed} }).filter(d => d && d.id)
            }
          })} theme="secondary">Save</Button>

          if (loading) 
            result = 
            <React.Fragment>
              <LinearProgress determinate={false}></LinearProgress>
              {result}
            </React.Fragment>
          if (error) console.error(error);

          if (data) this.props.history.goBack()

          return result
        }}
        </Mutation>
      </React.Fragment>
    )
  }
}