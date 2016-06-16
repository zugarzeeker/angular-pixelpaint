var app = angular.module('demo', ['ngSanitize', 'angular.pixelpaint']);

app.controller('DemoController', ['$scope', '$log', function($scope, $log) {

  $scope.shouldGenerateOutputImage = false;
  $scope.paintOptions = {
          cellSize: 10,
          largeGridEvery: 10,
          gridLineWidth: 1,
          gridSubDivisionLineWidth: 0.5,
          imageWidth: 18 * 3,
          imageHeight: 18 * 2,
          showGrid: true,
          imageData: null,
          brushColor: [0,0,0],
          paintEnabled: true
        };

  var imageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAACnVBMVEUAAAA6OjpcXFwFBQUAAAA3Njfo5+cjIyMbGxs6OjpjY2MODg4LDAzf399GR0c7PT03ODhvcG/f3t5SUlKmpqYODg5ycnItLS0QDw8ICAiop6cBAgLS0tJlZGS/vr6Xl5fW1dWenZ3X19eKiop4eXhoaGgmJia+vr5DRkYzNTTm5uYgICAwMDBdXV3ExMR+fn0iISFlZGQ4ODhbW1ubmppmZmYoKiqSkpLJyMh8fHtfX19KSkrd3NzS0dEgICBYWFiAgICJiYlzc3MwMDCysbFcXFx0c3N3d3aFhYSko6KQkJCLyOeXqNdol8e3traenp2XlpaNi4tvbm3q7e5UvO7i6Os5q+vp6elHrOORvuBAntljoNIvjtKBm8+OocgeeMdciL4/e7pTh7cobLeysbCpqKeBgIBlZWVRUlFVwPA9tfDe6u/F3us6metNtuo5p+amyOV/vuU3oePI1uF4uuFVpeFEp98tmN8zmt60utyirtp6rNibrNVwpNMlidONstI/ktF6pNBVm9B+oc7Ny8txm8pblMk8fMlWkMQpfsTEw8NjlcKptsEzd716mLxzkrtNfrmDnbhcfLhsj7Vvh7N1kbGZo66LlaWQlp5teJ2Mkpybm5qIj5qDhox+g4d8fXxAQD/JTilgqfPS4vF8w/Cs0+82pO9nwu1Tkuje4uW1y+VAquVFjuVtt+RYsuNCluBgrdyCtNurtNgyk9hTo9eJqNOHpNM4ltOSodLR0NDHy8+ot8xfmMtrpMpmkcdNjsa0vcU3iMVHfsWNrcSYq8BXe8CKlL0VbL27u7sjarZ+jbVbhrVOe7RBarEWXLEzZK+ImK55hKmDjaeCf6FWeJ1UaJCEe46wjYprYHtxdHSRXWFXV1eASlSuTjuiQTUEnl26AAAAR3RSTlMA/v0bEA3ozaBwW09H+/Dty8O7loZYUUg/NiwqKSUZCf738/Lx7+zm5OPc1tPIxb68u7mqppyalpSQj4uEfHVyb0Y9OTctGa8zTnIAAAHjSURBVCjPYoABRzExeQZsgEvE3EVGDlNOxkKJl41NS8hWCkVYzoZtZ2qgh0egv5+6iBtCXEpIIcB93qzp0+fMc0/z0neFicvqdaXNvRC3qaqqJu7SXPd0XVmIOKvJCY9ZfVt9Kit9fHx2nJrjftuYFeIeRa8Zk1ubm+NqtsXGHrs8ZUYQExdYg2FgwFRfIGhc1brv4q2ZCVO9mARBWpxVPaYldXS07ald3Djz7o0JZ5KmBak4ASU4gwImJibub9pY3XZt4Z3ECVP6jwS6OwAlrN09J/cmJ3c29V5deG93QcKkSX2e7pZACcCE0zxPnz+bXFsQvev6lcItnSfPJaS4mwIlrLw8+4/GHoquLj6QtKEwKirmeLdfkDBQwj4gdWJ7e3x8fU935Np1EWUx8fV+TJxACXFlz56GurrowwdjlpYW5UVsbij25xMHSjALerREVkTt3V5eXro+P2R1RSRvugAzA8i9TP4rS8oiwvKL1qzIzQwrCZ3NaAcOEmajDL9Q77ysrLDcRctCvENTFhgwQ0JRQicjJTjHe3lmyBLvnPDUBdoSsHDnYWec3xIenJ0dHN41n5GdGxFTkhxqjOkes/29bmbwc0gixy0LNwe7Jj+fhoAZNwtaamCR5hEV5ZGGCwMAQvCdr1XGESgAAAAASUVORK5CYII=";

  $scope.paintLayers = [
  {
      "type": "image",
      "image": imageBase64
  },
  {
      "type": "text",
      "text": "TEXT 2",
      "color": "#00ff00",
      "fontFamily": "verdana"
  },{
      "type": "text",
      "text": "ภาพ",
      "color": "#ff0000",
      "active": true,
      "fontSize": "20px"
  }];

}]);