async function initCalendar() {

    const data = await loadData();

    const calendarData = data.map(item => ({
        Id: item.release,
        Subject: item.release,
        StartTime: new Date(item.releaseDate),
        EndTime: new Date(item.releaseDate),
        IsAllDay: true,
        Description: item.descriptionHtml,
        ProjectId: item.attentions?.highlight ? 1 : 0,
    }));

    const schedule = new ej.schedule.Schedule({
        selectedDate: new Date(),
        width: '100%',
        height: '100%',
        //currentView: "Month",
        views: [{ option: 'Month', showWeekNumber: true, readonly: true }],
        //enablePersistence: true,
        readonly: true,
        eventSettings: {
            dataSource: calendarData,
            fields: {
                id: "Id",
                subject: { name: "Subject" },
                startTime: { name: "StartTime" },
                endTime: { name: "EndTime" },
                description: { name: "Description" },
                ProjectId: { name: "ProjectId " },
            }
        },
        eventRendered: function (args) {
            args.element.classList.add("calendar-event");

            console.log(args);
            if (args.data.ProjectId) {
                args.element.classList.add("calendar-event-highlight");
            }
        },
        popupOpen: function (args) {
            if (args.type === "QuickInfo" && args.data && args.data.Description) {

                args.element.querySelector('.e-subject').innerHTML = args.data.Subject;

                const desc = args.element.querySelector('.e-description');
                if (desc) {
                    desc.innerHTML = args.data.Description;
                }
            }

            if (args.type === "Editor") {
                args.cancel = true;
            }
        }
    });

    schedule.appendTo("#calendar");
}

initCalendar();