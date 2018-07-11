import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";

import { Todo } from "../../providers/todo/todo";
import { FeathersProvider } from "../../providers/feathers/feathers";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'todos-list',
  templateUrl: 'todos-list.html'
})
export class TodosListComponent implements OnDestroy, OnInit {
  @Output('edit') editRequest = new EventEmitter<string>();
  //@Output('remove') removeRequest = new EventEmitter<string>();
  @Output('done') doneEvent = new EventEmitter<{action: string, item: Todo}>();

  protected todos: Todo[] = [];
  private subscription: any; //TODO: DataSubscriber<Todo>;

  constructor(
    private feathersProvider: FeathersProvider,
    private ref: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.subscription = this.feathersProvider.subscribe<Todo>('todos', {
        $sort: {createdAt: -1},
        $limit: 25
      },
      (todos: Todo[]) => {
        this.todos = todos;
        this.ref.markForCheck();
      },
      err => {
        console.error('Error in FeathersProvider.subscribe(): ', err);
      });
  }

  public ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  // Edit button click
  edit(itemId) {
    console.log('TodoListComponent Edit button, itemId: %s', itemId);
    this.editRequest.emit(itemId);
  }

  // Delete button click
  remove(itemId) {
    console.log('TodoListComponent Remove button, itemId: %s', itemId);
    //?this.removeRequest.emit(itemId);
    this.feathersProvider.remove<Todo>('todos', <Todo>{ _id: itemId })
      .then(res => {
        console.log('FeathersProvider.remove result: %o', res); // DEBUG
        this.doneEvent.emit({action: 'removed', item: res});
      })
      .catch(err => {
        console.error('Error in FeathersProvider.remove: %o', err);
      });
  }
}
